<template>
  <div class="table-box">
    <ProTable
      ref="proTable"
      title="商品列表"
      :columns="columns"
      :requestApi="ProductApi.page"
      :initParam="initParam"
      :dataCallback="dataCallback"
      :searchCol="{ xs: 2, sm: 3, md: 4, lg: 6, xl: 8 }"
    >
      <template #tableHeader>
        <el-button type="primary" :icon="CirclePlus" v-hasPermi="['sys:product:add']" @click="openDrawer('新增')">新增商品</el-button>
      </template>

      <template #operation="scope">
        <el-button type="primary" link :icon="EditPen" v-hasPermi="['sys:product:edit']" @click="openDrawer('编辑', scope.row)">编辑</el-button>
        <el-button type="success" link :icon="Check" v-hasPermi="['sys:product:up']" @click="openStateDialog('商品定时上架', scope.row)" v-if="scope.row.status !== 1"
          >商品上架</el-button
        >
        <el-button type="danger" link :icon="Bottom" v-hasPermi="['sys:product:down']" @click="openStateDialog('商品定时下架', scope.row)" v-if="scope.row.status === 1"
          >商品下架</el-button
        >
      </template>
    </ProTable>
    <ProductDialog ref="dialogRef" />
    <ProductStateDialog ref="stateDialogRef" />
  </div>
</template>
<script setup lang="ts" name="ProductManage">
import { ref, reactive } from 'vue'
import { ColumnProps } from '@/components/ProTable/interface'
import { ProductStatusList } from '@/configs/enum'
import ProTable from '@/components/ProTable/index.vue'
import { ProductApi } from '@/api/modules/product'
import { Bottom, CirclePlus, EditPen, Check } from '@element-plus/icons-vue'
import ProductDialog from './components/ProductDialog.vue'
import ProductStateDialog from './components/ProductStateDialog.vue'

const proTable = ref()

const initParam = reactive({})
const props = defineProps({
  isShowHeader: {
    type: Boolean,
    default: true
  }
})

const dataCallback = (data: any) => {
  return {
    list: data.list,
    total: data.total
  }
}

const columns: ColumnProps[] = [
  { type: 'selection', fixed: 'left', width: 60 },
  {
    prop: 'name',
    label: '商品名称',
    search: { el: 'input' },
    minWidth: 120
  },
  {
    prop: 'price',
    label: '价格',
    minWidth: 120
  },
  {
    prop: 'sales',
    label: '销量',
    minWidth: 150
  },
  {
    prop: 'stock',
    label: '库存数量',
    minWidth: 120
  },
  {
    prop: 'status',
    label: '商品状态',
    minWidth: 120,
    enum: Object.values(ProductStatusList),
    search: { el: 'select' }
  },
  { prop: 'operation', label: '操作', fixed: 'right', width: 230, isShow: props.isShowHeader }
]

const dialogRef = ref()
const openDrawer = (title: string, row: Partial<any> = {}) => {
  let params = {
    title,
    row: { ...row },
    isView: title === '查看',
    api: ProductApi.saveOrEdit,
    getTableList: proTable.value.getTableList,
    maxHeight: '300px'
  }
  dialogRef.value.acceptParams(params)
}
const stateDialogRef = ref()
const openStateDialog = (title: string, row: Partial<any> = {}) => {
  let params = {
    title,
    row: { ...row },
    isView: title === '查看',
    api: ProductApi.saveOrEdit,
    getTableList: proTable.value.getTableList,
    maxHeight: '150px'
  }
  stateDialogRef.value.acceptParams(params)
}
defineExpose({
  proTable
})
</script>
