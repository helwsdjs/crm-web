<template>
  <div class="table-box">
    <ProTable
      :columns="columns"
      :requestApi="ProductApi.page"
      ref="proTable"
      title="商品列表"
      :initParam="initParam"
      :searchCol="{ xs: 2, sm: 3, md: 4, lg: 6, xl: 8 }"
      :dataCallback="dataCallback"
    >
      <!-- 表格头部按钮（不变） -->
      <template #tableHeader>
        <el-button type="primary" :icon="CirclePlus" v-hasPermi="['sys:product:add']" @click="openDialog('新增')">
          新增商品
        </el-button>
      </template>
      <!-- 表格操作按钮：文本改为“定时上架/定时下架”，点击打开对话框 -->
      <template #operation="scope">
        <el-button 
          type="primary" 
          link 
          :icon="EditPen" 
          v-hasPermi="['sys:product:edit']" 
          @click="openDialog('编辑', scope.row)"
        >
          编辑
        </el-button>
        <!-- 初始化/已下架 → 打开“定时上架”对话框 -->
        <el-button 
          v-if="scope.row.status === 0 || scope.row.status === 2" 
          type="success" 
          link 
          :icon="Clock" 
          v-hasPermi="['sys:product:online']" 
          @click="openTimingDialog(scope.row, 'ONLINE')"
        >
          定时上架
        </el-button>
        <!-- 已上架 → 打开“定时下架”对话框 -->
        <el-button 
          v-else-if="scope.row.status === 1" 
          type="danger" 
          link 
          :icon="Clock" 
          v-hasPermi="['sys:product:offline']" 
          @click="openTimingDialog(scope.row, 'OFFLINE')"
        >
          定时下架
        </el-button>
      </template>
    </ProTable>
    
    <!-- 商品编辑对话框（不变） -->
    <ProductDialog ref="dialogRef" />
    <!-- 定时上下架对话框（新增，关联适配后的组件） -->
    <ProductTimingDialog ref="timingDialogRef" />
  </div>
</template>

<script setup lang="ts" name="ProductManage">
import { ref, reactive, h } from 'vue';
import { ElMessage } from 'element-plus';
import { ColumnProps } from '@/components/ProTable/interface';
import ProTable from '@/components/ProTable/index.vue';
import { ProductStatusList } from '@/configs/enum';
import { ProductApi } from '@/api/modules/product';
import { CirclePlus, EditPen, Clock, Delete } from '@element-plus/icons-vue';
// 导入两个对话框组件
import ProductDialog from './components/ProductDialog.vue';
import ProductTimingDialog from './components/ProductTimingDialog.vue';

// 实例：新增定时对话框实例
const proTable = ref();
const dialogRef = ref();
const timingDialogRef = ref();

// 初始化请求参数（不变）
const initParam = reactive({});

// 数据处理回调（不变）
const dataCallback = (data: any) => {
  return {
    list: data.list,
    total: data.total
  };
};

// 表格列配置（不变）
const columns: ColumnProps[] = [
  { type: 'selection', fixed: 'left', width: 60 },
  {
    prop: 'coverImage',
    label: '商品封面',
    minWidth: 100,
    render: (scope) => {
      const row = scope.row;
      return h('img', {
        src: row.coverImage || 'https://picsum.photos/60/60',
        alt: '商品封面',
        style: {
          width: '60px',
          height: '60px',
          objectFit: 'cover',
          borderRadius: '4px'
        }
      });
    }
  },
  {
    prop: 'name',
    label: '商品名称',
    minWidth: 120,
    search: { el: 'input' }
  },
  {
    prop: 'price',
    label: '价格',
    minWidth: 120
  },
  {
    prop: 'sales',
    label: '销量',
    minWidth: 120
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
  {
    prop: 'operation',
    label: '操作',
    fixed: 'right',
    width: 250 // 加宽操作列，避免按钮拥挤
  }
];

// 打开编辑/新增对话框（不变）
const openDialog = (title: string, row: Partial<any> = {}) => {
  const params = {
    title,
    row: { ...row },
    isView: title === '查看',
    api: ProductApi.saveOrEdit,
    getTableList: proTable.value.getTableList,
    maxHeight: '500px'
  };
  dialogRef.value.acceptParams(params);
};

// 打开定时上下架对话框：传递自动匹配的操作类型（核心适配）
const openTimingDialog = (row: any, operateType: "ONLINE" | "OFFLINE") => {
  // 根据操作类型设置对话框标题
  const dialogTitle = operateType === 'ONLINE' ? '定时上架' : '定时下架';
  timingDialogRef.value.acceptParams({
    title: dialogTitle,
    row: { id: row.id, name: row.name, status: row.status },
    operateType: operateType, // 传递自动操作类型（无需用户选）
    api: ProductApi.timing, // 定时接口
    getTableList: proTable.value.getTableList // 刷新表格方法
  });
};
</script>