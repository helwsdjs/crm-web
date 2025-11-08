<template>
  <Dialog
    :model-value="dialogVisible"
    :title="dialogProps.title"
    :fullscreen="dialogProps.fullscreen"
    :max-height="dialogProps.maxHeight"
    :cancel-dialog="cancelDialog"
    width="80%"
    top="7vh"
  >
    <div :style="'width: calc(100% - ' + dialogProps.labelWidth! / 2 + 'px)'">
      <el-form
        ref="ruleFormRef"
        label-position="right"
        :label-width="dialogProps.labelWidth + 'px'"
        :rules="rules"
        :model="dialogProps.row"
        :disabled="dialogProps.isView"
        :hide-required-asterisk="dialogProps.isView"
      >
        <el-form-item label="合同编号" prop="number" v-if="dialogProps.row!.id">
          <el-input v-model="dialogProps.row!.number" readonly="true" show-word-limit></el-input>
        </el-form-item>
        <el-form-item label="合同名称" prop="name">
          <el-input v-model="dialogProps.row!.name" clearable maxlength="100" show-word-limit></el-input>
        </el-form-item>
        <el-form-item label="签约客户" prop="customerId">
          <div class="flex" style="width: 100%">
            <el-input v-model="dialogProps.row!.customerName" placeholder="请选择要签约的客户" class="mr-18px" disabled> </el-input>

            <el-button type="primary" @click="openCustomerDialog">客户信息</el-button>
            <CustomerDialog ref="customerRef" @get-customer-data="openCustomerDialog" />
          </div>
        </el-form-item>
        <div class="flex" style="width: 100%">
          <el-form-item label="合同开始时间" prop="startTime">
            <el-date-picker
              v-model="dialogProps.row!.startTime"
              type="date"
              placeholder="选择合同开始时间"
              value-format="YYYY-MM-DD"
              :disabled-date="(time) => time.getTime() < Date.now() - 8.64e7"
            />
          </el-form-item>
          <el-form-item label="合同结束时间" prop="endTime">
            <el-date-picker
              v-model="dialogProps.row!.endTime"
              type="date"
              placeholder="选择合同结束时间"
              value-format="YYYY-MM-DD"
              :disabled-date="(time) => time.getTime() < Date.now() - 8.64e7"
            />
          </el-form-item>
          <el-form-item label="合同签约时间" prop="signTime">
            <el-date-picker
              v-model="dialogProps.row!.signTime"
              type="date"
              placeholder="选择合同签约时间"
              value-format="YYYY-MM-DD"
              :disabled-date="(time) => time.getTime() < Date.now() - 8.64e7"
            />
          </el-form-item>
        </div>
        <div class="flex" style="width: 100%">
          <el-form-item label="合同总金额" prop="amount" style="flex: 1">
            <el-input v-model="dialogProps.row!.amount" clearable></el-input>
          </el-form-item>
          <el-form-item label="已收款项" prop="receivedAmount" style="flex: 1">
            <el-input v-model="dialogProps.row!.receivedAmount" clearable></el-input>
          </el-form-item>
        </div>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="dialogProps.row!.remark" clearable type="textarea" maxlength="100" show-word-limit></el-input>
        </el-form-item>
        <div style="width: 100%">
          <h2>合同产品关系</h2>
          <el-divider />
<el-table :data="dialogProps.row.products" border style="width: 100%">
  <!-- 商品名称列：绑定 scope.row.pName -->
  <el-table-column prop="pName" label="商品录入" min-width="140">
    <template #default="scope">
      <!-- 绑定当前行的 pName，而非外层 dialogProps.row -->
      <el-input 
        v-model="scope.row.pName" 
        disabled 
        placeholder="请选择商品" 
        style="width: 180px" 
      />
      <!-- 打开弹窗时传递当前行索引（用于后续映射数据） -->
      <el-button type="primary" style="margin-left: 5px" @click="openProductSelectDialog(scope.$index)">
        选择商品
      </el-button>
    </template>
  </el-table-column>

  <!-- 单价列：绑定 scope.row.price -->
  <el-table-column prop="price" label="单价" min-width="100">
    <template #default="scope">
      <!-- 绑定当前行的 price，而非外层 dialogProps.row -->
      <el-input 
        v-model="scope.row.price" 
        disabled 
        style="width: 100px" 
      />
    </template>
  </el-table-column>

  <!-- 数量列：保持不变（已绑定 scope.row.count） -->
  <el-table-column prop="count" label="数量" min-width="100">
    <template #default="scope">
      <el-input-number 
        v-model="scope.row.count" 
        :min="1" 
        @change="calculateSubtotal(scope.row)" 
        style="width: 100px" 
      />
    </template>
  </el-table-column>

  <!-- 小计列：删除冗余 el-input，直接显示 scope.row.totalPrice -->
  <el-table-column prop="totalPrice" label="小计" min-width="100" />

  <!-- 操作列：保持不变 -->
  <el-table-column label="操作" min-width="80">
    <template #default="scope">
      <el-button type="danger" size="small" link @click="removeContractProduct(scope.$index)"> 删除 </el-button>
    </template>
  </el-table-column>
</el-table>

<!-- 商品选择弹窗：回调绑定到专门的接收方法（不要和打开方法同名） -->
<ProductDialog ref="productRef" @get-product-data="handleProductSelect" />
          <div style="display: flex; justify-content: center; width: 100%; margin-top: 10px">
            <el-button type="primary" @click="addContractProduct"> + 添加合同产品关系 </el-button>
          </div>
        </div>
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
import { ElMessage, FormInstance,FormRules } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import CustomerDialog from './CustomerDialog.vue'
import ProductDialog from './ProductDialog.vue'
import { ContractApi } from '@/api/modules/contract'


// 定义前端表格商品行类型（明确字段，用于校验）
interface ProductItem {
  pId: number;
  pName: string;
  price: number;
  count: number;
  totalPrice: number;
}

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
const dialogVisible = ref(false)
const dialogProps = ref<DialogProps>({
  isView: false,
  title: '',
  row: {
    products: []
  },
  labelWidth: 120,
  fullscreen: false,
  maxHeight: '500px'
})
// 定义后端返回的 ContractProduct 实体类型（匹配后端字段）
interface ContractProduct {
  pid: number;    // 后端商品ID字段
  pname: string;  // 后端商品名称字段
  price: number;        // 单价
  count: number;        // 数量
  totalPrice: number;   // 小计
  // 其他后端返回的字段（如有，可补充）
}
// 接收父组件传过来的参数（修复参数合并逻辑）
const acceptParams = async (params: DialogProps): Promise<void> => {
  // 核心修复：正确合并参数，确保 products 始终是数组
  const mergedRow = {
    ...dialogProps.value.row, // 原有数据（包含初始的 products: []）
    ...params.row,            // 父组件传入的参数（可能没有 products）
    products: params.row.products || dialogProps.value.row.products || [] // 兜底数组
  };
  // 赋值给 dialogProps，替换原来的 params.row 合并方式
  dialogProps.value = { ...dialogProps.value, ...params, row: mergedRow };
  
  const contractId = dialogProps.value.row.id;

  // 编辑/查看场景（有合同ID）：回显商品关联数据
  if (contractId) {
    try {
      // 调用接口（已修复参数传递方式）
      const productResult = await ContractApi.getContractProduct(contractId);
      const productList = (productResult.data || []) as ContractProduct[];
      console.log('后端返回的商品列表：', productList);

      // 字段映射（后端 ContractProduct → 前端 ProductItem）
      // 注意：这里要启用映射，否则字段名不匹配会导致表格无数据
      dialogProps.value.row.products = productList.map(item => ({
        pId: item.pid || 0,    // 后端 productId → 前端 pId
        pName: item.pname || '',// 后端 productName → 前端 pName
        price: Number(item.price) || 0,
        count: Number(item.count) || 1,
        totalPrice: Number(item.totalPrice) || 0
      }));

      // 同步回显合同总金额（此时 products 已是数组，可安全调用 reduce）
      const totalAmount = dialogProps.value.row.products.reduce(
        (total: number, item: { totalPrice: number }) => total + (item.totalPrice || 0),
        0
      );
      dialogProps.value.row.amount = Number(totalAmount.toFixed(2));
    } catch (error) {
      ElMessage.error('商品关联数据回显失败');
      console.error('回显失败：', error);
      dialogProps.value.row.products = []; // 失败时置空为数组
    }
  } else {
    // 新增场景：重置商品列表为数组
    dialogProps.value.row.products = [];
  }
  dialogVisible.value = true;
};
defineExpose({
  acceptParams
})
const ruleFormRef = ref<FormInstance>()
const rules = reactive<FormRules<DialogProps['row']>>({
  name: [{ required: true, message: '请输入合同名称', trigger: 'blur' }],
  customerId: [{ required: true, message: '请选择签约客户', trigger: 'change' }],
  startTime: [{ required: true, message: '请选择合同开始时间', trigger: 'change' }],
  endTime: [{ required: true, message: '请选择合同结束时间', trigger: 'change' }],
  signTime: [{ required: true, message: '请选择合同签约时间', trigger: 'change' }],
  amount: [{ required: true, message: '请输入合同总金额', trigger: 'blur' }],
  products: [{
    validator: (rule, value: ProductItem[], callback) => {
      // 至少添加1个商品（可根据需求调整为≥2）
      if (value.length === 0) {
        callback(new Error('请至少添加1个合同产品'));
      } else {
        // 检查所有商品是否都已选择（pId≠0 且 pName不为空）
        const unselectedProducts = value.filter(item => item.pId === 0 || !item.pName.trim());
        if (unselectedProducts.length > 0) {
          // 获取未选择商品的序号（索引+1）
          const indexes = unselectedProducts.map(item => value.indexOf(item) + 1).join('、');
          callback(new Error(`第${indexes}个商品未选择，请补充`));
        } else {
          callback(); // 所有商品都已选择，校验通过
        }
      }
    },
    trigger: 'submit'
  }]
});


const handleSubmit = () => {
  ruleFormRef.value!.validate(async (valid) => {
    if (!valid) return
    try {
      delete dialogProps.value.row['updateTime']
      delete dialogProps.value.row['createTime']
      console.log(dialogProps.value.row)
      await dialogProps.value.api!(dialogProps.value.row)
      ElMessage.success({ message: `${dialogProps.value.title}成功！` })
      dialogProps.value.getTableList!()
      dialogVisible.value = false
      ruleFormRef.value!.resetFields()
      cancelDialog(true)
    } catch (error) {
      console.log(error)
    }
  })
}
const cancelDialog = (isClean?: boolean) => {
  dialogVisible.value = false
  let condition = ['查看', '编辑']
  if (condition.includes(dialogProps.value.title) || isClean) {
    dialogProps.value.row = {}
    ruleFormRef.value!.resetFields()
  }
}

const customerRef = ref()
const productRef = ref()

const openCustomerDialog = (val) => {
  let params = {
    title: '客户列表',
    fullscreen: false,
    maxHeight: '500px'
  }
  if (val.id && val.name) {
      console.log(dialogProps.value.row)
    dialogProps.value.row.customerId = val.id
    dialogProps.value.row.customerName = val.name
  }
  customerRef.value.acceptParams(params)
}

// 新增：存储当前正在编辑的表格行索引（关键：关联选择的商品到对应行）
const currentProductIndex = ref(-1)

// 1. 打开商品选择弹窗：记录当前行索引
const openProductSelectDialog = (index: number) => {
  currentProductIndex.value = index; // 保存点击的行索引
  const params = {
    title: '商品列表',
    fullscreen: false,
    maxHeight: '500px'
  };
  productRef.value.acceptParams(params); // 打开弹窗
};

// 2. 接收商品选择弹窗返回的数据：映射到当前表格行
const handleProductSelect = (selectedProduct: { id: number; name: string; price?: number }) => {
  // 校验商品数据是否有效
  console.log(selectedProduct)
  if (!selectedProduct || !selectedProduct.id || !selectedProduct.name) {
    ElMessage.warning('请选择有效的商品');
    return;
  }

  // 获取表格数据和当前行
  const products = dialogProps.value.row.products;
  const targetRow = products[currentProductIndex.value];

  if (targetRow) {
    // 映射商品数据到当前表格行（关键：给 scope.row 赋值）
    targetRow.pId = selectedProduct.id; // 商品ID
    targetRow.pName = selectedProduct.name; // 商品名称
    targetRow.price = selectedProduct.price || 0; // 商品单价（默认0避免计算错误）
    
    // 自动计算当前行小计（数量默认1，所以直接计算）
    calculateSubtotal(targetRow);
    
    // 重置索引
    currentProductIndex.value = -1;
  }
};

// 3. 计算小计和总金额：保持逻辑，但确保 row 是表格行数据
const calculateSubtotal = (row: { price: number; count: number; totalPrice: number }) => {
  // 1. 计算当前行小计：先乘后四舍五入，保留两位小数（转数字避免字符串拼接问题）
  const subtotal = (row.price || 0) * (row.count || 1);
  row.totalPrice = Number(subtotal.toFixed(2)); // 转数字后赋值，保证响应式正常

  // 2. 计算合同总金额：累加所有行小计后保留两位小数
  const totalAmount = dialogProps.value.row.products.reduce(
    (total: number, item: { totalPrice: number }) => total + (item.totalPrice || 0),
    0
  );
  dialogProps.value.row.amount = Number(totalAmount.toFixed(2)); // 总金额同样保留两位
};
const removeContractProduct = (index) => {
  dialogProps.value.row.products.splice(index, 1)
}

const addContractProduct = () => {
  dialogProps.value.row.products.push({
    pName: '',
    pId: 0,
    price: 0,
    count: 1,
    totalPrice: 0
  })
}
</script>
