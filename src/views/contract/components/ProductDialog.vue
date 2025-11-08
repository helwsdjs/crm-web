<template>
  <Dialog
    :model-value="dialogVisible"
    :title="dialogProps.title"
    :fullscreen="dialogProps.fullscreen"
    :max-height="dialogProps.maxHeight"
    :cancel-dialog="cancelDialog"
    width="70%"
    top="8vh"
  >
  <ProductManage :is-show-header="false" ref="productManageRef" ></ProductManage>
    <template #footer>
      <slot name="footer">
        <el-button @click="cancelDialog">取消</el-button>
        <el-button type="primary" @click="getProductData()">确定</el-button>
      </slot>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Dialog } from '@/components/Dialog'
import ProductManage from '@/views/Product/ProductManage.vue'
import { ElMessage } from 'element-plus'
// import { ElMessage } from 'element-plus'

interface DialogProps {
  title: string
  isView: boolean
  fullscreen?: boolean
  row: any
  labelWidth?: number
  maxHeight?: number | string
  api?: (params: any) => Promise<any>
  getTableList?: () => Promise<any>
}

const productManageRef = ref()

const dialogVisible = ref(false)
const dialogProps = ref<DialogProps>({
  isView: false,
  title: '',
  row: {},
  labelWidth: 160,
  fullscreen: false,
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

const cancelDialog = () => {
  dialogVisible.value = false
}

const emit = defineEmits(['getProductData'])

const getProductData = () => {
  if (!productManageRef.value || !productManageRef.value.proTable) {
    ElMessage.error('组件加载异常，请刷新重试')
    return
  }

  const { selectedListIds, selectedList } = productManageRef.value.proTable
  if (selectedListIds.length === 0) {
    ElMessage.warning('请选择一个商品')
  } else if (selectedListIds.length > 1) {
    ElMessage.warning('只能选择一个商品')
  } else {
    const param = {
      id: selectedListIds[0],
      name: selectedList[0].name,
      price: selectedList[0].price
    }
    emit('getProductData', param)
    dialogVisible.value = false
  }
}
</script>
