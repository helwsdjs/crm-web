<template>
    <Dialog :model-value="dialogVisible" :title="dialogProps.title" :fullscreen="dialogProps.fullscreen"
        :max-height="dialogProps.maxHeight" :cancel-dialog="cancelDialog" width="45%">
        <div :style="'width: calc(100% - ' + dialogProps.labelWidth! / 2 + 'px)'">
            <!-- 修复1：给el-form绑定ref="ruleFormRef"，并补充rules、model等必要属性 -->
            <el-form
                ref="ruleFormRef"
                label-position="right"
                :label-width="dialogProps.labelWidth + 'px'"
                :rules="rules"
                :model="dialogProps.row"
                :disabled="dialogProps.isView"
                :hide-required-asterisk="dialogProps.isView"
            >
                            <el-form-item label="客户名称" prop="name">
                      <el-input v-model="dialogProps.row!.name" placeholder="请填写用户名称" clearable></el-input>
                </el-form-item>
                                            <el-form-item label="客户手机号" prop="phone">
                      <el-input v-model="dialogProps.row!.phone" placeholder="请填写用户名称" clearable></el-input>
                </el-form-item>
                <el-form-item label="客户邮箱" prop="email">
                      <el-input v-model="dialogProps.row!.email" placeholder="请填写用户邮箱" clearable></el-input>
                </el-form-item>
                <el-form-item label="客户地址" prop="address">
                    <el-input v-model="dialogProps.row!.address" placeholder="请填写客户地址" clearable maxlength="50"
                        show-word-limit></el-input>
                </el-form-item>
                <el-form-item label="客户等级" prop="level">
                    <el-select v-model="dialogProps.row!.level" filterable placeholder="请选择客户等级">
                        <el-option v-for="item in Object.values(CustomerLevelList)" :key="item.value"
                            :label="item.label" :value="item.value" />
                    </el-select>
                </el-form-item>
                <el-form-item label="客户来源" prop="source">
                    <el-select v-model="dialogProps.row!.source" filterable placeholder="请选择客户来源">
                        <el-option v-for="item in Object.values(CustomerSourceList)" :key="item.value"
                            :label="item.label" :value="item.value" />
                    </el-select>
                </el-form-item>
                <el-form-item label="跟进状态" prop="followStatus">
                    <el-select v-model="dialogProps.row!.followStatus" filterable placeholder="请选择客户跟进状态">
                        <el-option v-for="item in Object.values(FollowUpStatusList)" :key="item.value"
                            :label="item.label" :value="item.value" />
                    </el-select>
                </el-form-item>
                <el-form-item label="是否为关键决策人" prop="isKeyDecisionMaker">
                    <el-select v-model="dialogProps.row!.isKeyDecisionMaker" filterable placeholder="请选择客户是否为关键决策人">
                        <el-option v-for="item in Object.values(IsKeyDecisionMakerList)" :key="item.value"
                            :label="item.label" :value="item.value" />
                    </el-select>
                </el-form-item>
                <el-form-item label="客户性别" prop="gender">
                    <el-select v-model="dialogProps.row!.gender" filterable placeholder="请选择客户性别">
                        <el-option v-for="item in Object.values(GenderList)" :key="item.value" :label="item.label"
                            :value="item.value" />
                    </el-select>
                </el-form-item>
            </el-form>
        </div>
        <template #footer>
            <slot name="footer">
                <el-button @click="cancelDialog">取消</el-button>
                <el-button type="primary" v-show="!dialogProps.isView" @click="handleSubmit">确定</el-button>
            </slot>
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, FormInstance } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { CustomerLevelList, CustomerSourceList, FollowUpStatusList, GenderList, IsKeyDecisionMakerList } from '@/configs/enum'

interface DialogProps {
    name: string,
    phone: number | null,
    email: string
    title: string
    isView: boolean
    fullscreen?: boolean
    row: any
    labelWidth?: number
    maxHeight?: number | string
    api?: (params: any) => Promise<any>
    getTableList?: () => Promise<any>
}

const dialogVisible = ref(false)
const dialogProps = ref<DialogProps>({
    name: '',
    phone: null,
    email: '',
    isView: false,
    title: '',
    row: {},
    labelWidth: 160,
    fullscreen: true,
    maxHeight: '500px'
})

// 接收父组件传过来的参数
const acceptParams = (params: DialogProps): void => {
    params.row = { ...dialogProps.value.row, ...params.row }
    dialogProps.value = { ...dialogProps.value, ...params }
    dialogVisible.value = true
}

defineExpose({
    acceptParams
})

const rules = reactive({
    name: [{ required: true, message: '请输客户名称', trigger: 'blur' }],
    phone: [
        { required: true, message: '请输手机号', trigger: 'blur' },
        {
            pattern: /^1[3-9]\d{9}$/,
            message: '手机号格式不正确',
            trigger: 'blur'
        }
    ],
    email: [
        { required: true, message: '请输入邮箱地址', trigger: 'blur' },
        {
            pattern: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
            message: '邮箱格式不正确',
            trigger: 'blur'
        }
    ],
    level: [{ required: true, message: '客户级别不能为空', trigger: 'blur' }],
    source: [{ required: true, message: '客户来源不能为空', trigger: 'blur' }]
})

const ruleFormRef = ref<FormInstance>()

// 修复2：调用validate前判断ruleFormRef.value是否存在，避免undefined报错
const handleSubmit = () => {
    if (!ruleFormRef.value) return
    ruleFormRef.value.validate(async (valid) => {
        if (!valid) return
        try {
            delete dialogProps.value.row['updateTime']
            delete dialogProps.value.row['createTime']
            await dialogProps.value.api!(dialogProps.value.row)
            ElMessage.success({ message: `${dialogProps.value.title}成功！` })
            dialogProps.value.getTableList!()
            dialogVisible.value = false
            // 修复3：调用resetFields前判断ruleFormRef.value是否存在
            if (ruleFormRef.value) {
                ruleFormRef.value.resetFields()
            }
            cancelDialog(true)
        } catch (error) {
            console.log(error)
        }
    })
}

// 修复4：调用resetFields前判断ruleFormRef.value是否存在
const cancelDialog = (isClean?: boolean) => {
    dialogVisible.value = false
    let condition = ['查看', '编辑']
    if ((condition.includes(dialogProps.value.title) || isClean) && ruleFormRef.value) {
        dialogProps.value.row = {}
        ruleFormRef.value.resetFields()
    }
}
</script>