<template>
  <!-- 定时上下架对话框（删除操作类型选择） -->
  <el-dialog
    v-model="dialogVisible"
    :title="dialogProps.title"
    :width="dialogWidth"
    :close-on-click-modal="false"
    :destroy-on-close="true"
    @close="handleClose"
  >
    <!-- 表单区域 -->
    <el-form
      ref="formRef"
      :model="form"
      :rules="formRules"
      label-width="120px"
      class="mt-4"
    >
      <!-- 商品名称（只读） -->
      <el-form-item label="商品名称">
        <el-input
          v-model="form.name"
          placeholder="商品名称"
          readonly
          disabled
        ></el-input>
      </el-form-item>

      <!-- 自动显示当前操作类型（无需选择） -->
      <el-form-item label="当前操作">
        <el-input
          v-model="form.operateTypeText"
          placeholder="操作类型"
          readonly
          disabled
          :style="{ color: form.operateType === 'ONLINE' ? '#10b981' : '#ef4444' }"
        ></el-input>
      </el-form-item>

      <!-- 定时时间选择（保留） -->
      <el-form-item label="执行时间" prop="timingTime">
        <el-date-picker
          v-model="form.timingTime"
          type="datetime"
          placeholder="选择执行时间"
          :disabled-date="disabledPastDate"
          class="w-full"
          value-format="YYYY-MM-DD HH:mm:ss"
        ></el-date-picker>
      </el-form-item>

      <!-- 当前状态提示（保留） -->
      <el-form-item>
        <el-tag
          :type="form.status === 1 ? 'success' : 'info'"
          class="mt-1"
        >
          当前商品状态：{{ form.status === 1 ? '已上架' : form.status === 2 ? '已下架' : '初始化' }}
        </el-tag>
      </el-form-item>
    </el-form>

    <!-- 底部按钮（保留） -->
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button
        type="primary"
        @click="handleSubmit"
      >
        确认设置
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts" name="ProductTimingDialog">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

// 定义对话框接收的参数类型：新增operateType（由父组件传递，自动匹配）
interface DialogProps {
  title: string // 对话框标题（如“定时上架”“定时下架”）
  row: {
    id: number // 商品ID
    name: string // 商品名称
    status: number // 商品当前状态（0-初始化，1-上架，2-下架）
  }
  operateType: "ONLINE" | "OFFLINE" // 自动匹配的操作类型（父组件传递）
  api: (params: any) => Promise<any> // 定时接口（父组件传入）
  getTableList: () => Promise<any> // 表格刷新方法（父组件传入）
}

// 对话框状态
const dialogVisible = ref(false)
const dialogWidth = ref('500px')
const formRef = ref<FormInstance>()

// 默认参数
const dialogProps = ref<DialogProps>({
  title: '定时上下架',
  row: { id: 0, name: '', status: 0 },
  operateType: 'ONLINE', // 默认上架（父组件会覆盖）
  api: async () => ({}),
  getTableList: async () => ({})
})

// 表单数据：删除手动选择的operateType，改为父组件传递的自动值
const form = reactive({
  id: 0, // 商品ID
  name: '', // 商品名称（只读）
  status: 0, // 商品当前状态
  operateType: 'ONLINE' as "ONLINE" | "OFFLINE", // 父组件传递的自动操作类型
  operateTypeText: '', // 操作类型文本（用于显示，如“定时上架”）
  timingTime: '' // 定时执行时间（格式：YYYY-MM-DD HH:mm:ss）
})

// 表单校验规则：只校验时间（操作类型无需校验，父组件已传递）
const formRules = reactive<FormRules>({
  timingTime: [
    { required: true, message: '请选择执行时间', trigger: 'blur' }
  ]
})

// 接收父组件传递的参数：自动匹配操作类型文本
const acceptParams = (params: DialogProps) => {
  dialogProps.value = { ...dialogProps.value, ...params }
  // 同步表单数据 + 自动设置操作类型文本
  form.id = params.row.id
  form.name = params.row.name
  form.status = params.row.status
  form.operateType = params.operateType
  // 根据操作类型自动显示文本
  form.operateTypeText = params.operateType === 'ONLINE' ? '定时上架' : '定时下架'
  
  // 重置表单
  form.timingTime = ''
  if (formRef.value) {
    formRef.value.clearValidate()
  }
  // 显示对话框
  dialogVisible.value = true
}

// 禁用过去的时间（保留）
const disabledPastDate = (time: Date) => {
  return time.getTime() < Date.now() - 1000
}

// 关闭对话框（保留）
const handleClose = () => {
  dialogVisible.value = false
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

// 提交表单：使用自动匹配的operateType（无需用户选择）
const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (isValid) => {
    if (!isValid) return

    try {
      // 👇 核心修改：构造包含 executeTime 的参数（传给后端）
      const submitParams = {
        productId: form.id, // 商品ID
        operateType: form.operateType, // 操作类型（ONLINE/OFFLINE）
        executeTime: form.timingTime // 定时时间（用户选择的时间，格式：YYYY-MM-DD HH:mm:ss）
      }

      // 👇 调用父组件传入的 api（ProductApi.timing），把包含时间的参数传过去
      await dialogProps.value.api(submitParams)

      ElMessage.success(`${dialogProps.value.title}设置成功！`)
      handleClose()
      await dialogProps.value.getTableList()
    } catch (error) {
      ElMessage.error(`${dialogProps.value.title}设置失败，请重试！`)
    }
  })
}
// 暴露方法给父组件
defineExpose({
  acceptParams
})
</script>

<style scoped>
.el-form-item {
  margin-bottom: 20px;
}
.el-tag {
  margin-top: 5px;
}
</style>