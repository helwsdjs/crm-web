<template>
  <div class="table-box">
    <ProTable
      ref="proTable"
      title="合同列表"
      :columns="columns"
      :requestApi="ContractApi.page"
      :initParam="initParam"
      :dataCallback="dataCallback"
      :searchCol="{ xs: 2, sm: 3, md: 4, lg: 6, xl: 8 }"
    >
      <template #tableHeader>
        <el-button type="primary" :icon="CirclePlus" v-hasPermi="['sys:contract:add']" @click="openDrawer('新增')">新增合同</el-button>
      </template>

      <template #operation="scope">
        <el-button type="primary" link :icon="EditPen" v-hasPermi="['sys:contract:edit']" @click="openDrawer('编辑', scope.row)">编辑</el-button>
        <el-button 
          type="success" 
          link 
          :icon="Printer" 
          v-hasPermi="['sys:contract:print']" 
          @click="handlePrint(scope.row)"
          class="ml-2"
        >
          打印
        </el-button>
      </template>
    </ProTable>
    <ContractDialog ref="dialogRef" />
    
    <!-- 打印模板 -->
    <div id="printContractTemplate" class="print-template">
      <div class="print-container">
        <h1 class="print-title" id="printTitle"></h1>
        <div class="print-info">
          <div class="print-row">
            <span class="print-label">合同编号：</span>
            <span id="printNumber"></span>
          </div>
          <div class="print-row">
            <span class="print-label">客户姓名：</span>
            <span id="printCustomerName"></span>
          </div>
          <div class="print-row">
            <span class="print-label">合同金额：</span>
            <span id="printAmount"></span>
          </div>
          <div class="print-row">
            <span class="print-label">已收款项：</span>
            <span id="printReceivedAmount"></span>
          </div>
          <div class="print-row">
            <span class="print-label">合同状态：</span>
            <span id="printStatus"></span>
          </div>
          <div class="print-row">
            <span class="print-label">签约时间：</span>
            <span id="printSignTime"></span>
          </div>
          <div class="print-row">
            <span class="print-label">生效时间：</span>
            <span id="printStartTime"></span>
          </div>
          <div class="print-row">
            <span class="print-label">到期时间：</span>
            <span id="printEndTime"></span>
          </div>
        </div>
        <div class="print-sign-area">
          <div class="print-sign-item">
            <p>甲方（盖章）：__________</p>
            <p>日期：__________</p>
          </div>
          <div class="print-sign-item">
            <p>乙方（签字）：__________</p>
            <p>日期：__________</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="ContractManage">
import { ref, reactive } from 'vue'
import { ColumnProps } from '@/components/ProTable/interface'
import ProTable from '@/components/ProTable/index.vue'
import { ContractApi } from '@/api/modules/contract/index'
import { ContractStatusList } from '@/configs/enum'
import { CirclePlus, EditPen, Printer } from '@element-plus/icons-vue'
import ContractDialog from './components/ContractDialog.vue'
import { ElMessage } from 'element-plus'

// 导入print-js并断言为any
import printJs from 'print-js'
import 'print-js/dist/print.css'
const printJsAny = printJs as any

// ProTable实例引用
const proTable = ref()
// 初始化请求参数
const initParam = reactive({})
// 对话框实例引用
const dialogRef = ref()

// 数据格式转换回调
const dataCallback = (data: any) => {
  return {
    list: data.list,
    total: data.total
  }
}

// 表格列配置
const columns: ColumnProps[] = [
  { type: 'selection', fixed: 'left', width: 60 },
  {
    prop: 'name',
    label: '合同名称',
    search: { el: 'input' }
  },
  {
    prop: 'number',
    label: '合同编号',
    minWidth: 120,
    search: { el: 'input' }
  },
  {
    prop: 'customerName',
    label: '客户姓名',
    minWidth: 120,
    search: { el: 'input' }
  },
  {
    prop: 'amount',
    label: '合同金额',
    minWidth: 100
  },
  {
    prop: 'receivedAmount',
    label: '已收到款项',
    minWidth: 140
  },
  {
    prop: 'status',
    label: '合同状态',
    minWidth: 120,
    enum: Object.values(ContractStatusList),
    search: { el: 'select' }
  },
  {
    prop: 'signTime',
    label: '签约时间',
    minWidth: 140
  },
  {
    prop: 'startTime',
    label: '合同开始时间',
    minWidth: 140
  },
  {
    prop: 'endTime',
    label: '合同结束时间',
    minWidth: 140
  },
  { prop: 'operation', label: '操作', fixed: 'right', width: 420 }
]

// 打开抽屉（新增/编辑）
const openDrawer = (title: string, row: Partial<any> = {}) => {
  let params = {
    title,
    row: { ...row },
    isView: title === '查看',
    api: ContractApi.saveOrEdit,
    getTableList: proTable.value?.getTableList,
    maxHeight: '300px'
  }
  dialogRef.value?.acceptParams(params)
}

/** 时间格式化工具 */
const formatDate = (date: string | number | Date, format = 'YYYY-MM-DD HH:mm:ss') => {
  if (!date) return '无'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '无效时间'
  
  const opt: Record<string, string> = {
    'Y+': d.getFullYear().toString(),
    'M+': (d.getMonth() + 1).toString().padStart(2, '0'),
    'D+': d.getDate().toString().padStart(2, '0'),
    'H+': d.getHours().toString().padStart(2, '0'),
    'm+': d.getMinutes().toString().padStart(2, '0'),
    's+': d.getSeconds().toString().padStart(2, '0')
  }
  
  for (const k in opt) {
    const reg = new RegExp(`(${k})`)
    format = format.replace(reg, opt[k])
  }
  return format
}

/** 金额格式化工具 */
const formatMoney = (money: number | string, decimal = 2) => {
  if (!money && money !== 0) return '0.00'
  const num = Number(money)
  if (isNaN(num)) return '0.00'
  return num.toFixed(decimal).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/** 核心打印逻辑（确保取消后刷新页面） */
const handlePrint = (row: any) => {
  try {
    // 🔥 关键修复1：提前绑定onafterprint事件（在所有DOM操作之前）
    let refreshTriggered = false // 防止重复刷新
    const handleRefresh = () => {
      if (refreshTriggered) return
      refreshTriggered = true
      console.log('触发打印后刷新页面')
      // 延迟50ms刷新，确保浏览器打印状态已释放
      setTimeout(() => {
        window.location.reload()
      }, 50)
      // 移除所有事件监听
      window.onafterprint = null
    }

    // 绑定浏览器原生事件（优先级最高）
    window.onafterprint = handleRefresh

    // 1. 获取模板元素
    const printTemplate = document.getElementById('printContractTemplate') as HTMLElement | null
    if (!printTemplate) {
      ElMessage.error('打印模板不存在，请刷新页面！')
      handleRefresh() // 异常时也刷新
      return
    }

    // 2. 安全获取所有需要填充的DOM元素
    const printTitle = document.getElementById('printTitle') as HTMLElement | null
    const printNumber = document.getElementById('printNumber') as HTMLElement | null
    const printCustomerName = document.getElementById('printCustomerName') as HTMLElement | null
    const printAmount = document.getElementById('printAmount') as HTMLElement | null
    const printReceivedAmount = document.getElementById('printReceivedAmount') as HTMLElement | null
    const printStatus = document.getElementById('printStatus') as HTMLElement | null
    const printSignTime = document.getElementById('printSignTime') as HTMLElement | null
    const printStartTime = document.getElementById('printStartTime') as HTMLElement | null
    const printEndTime = document.getElementById('printEndTime') as HTMLElement | null

    // 3. 填充数据
    console.log('填充的合同数据：', row)
    if (printTitle) printTitle.textContent = row.name || '合同详情'
    if (printNumber) printNumber.textContent = row.number || '无'
    if (printCustomerName) printCustomerName.textContent = row.customerName || '无'
    if (printAmount) printAmount.textContent = `${formatMoney(row.amount)} 元`
    if (printReceivedAmount) printReceivedAmount.textContent = `${formatMoney(row.receivedAmount)} 元`

    const statusItem = Object.values(ContractStatusList).find(
      item => String(item.value) === String(row.status)
    )
    if (printStatus) printStatus.textContent = statusItem?.label || '未知状态'

    if (printSignTime) printSignTime.textContent = formatDate(row.signTime)
    if (printStartTime) printStartTime.textContent = formatDate(row.startTime)
    if (printEndTime) printEndTime.textContent = formatDate(row.endTime)

    // 4. 打印前准备：显示模板 + 隐藏其他元素
    printTemplate.style.display = 'block'
    printTemplate.style.width = '100%'

    // 隐藏页面其他元素（避免干扰打印）
    const otherElements = document.querySelectorAll('.table-box > :not(#printContractTemplate), .el-drawer, .el-dialog, .el-header, .el-footer, .el-menu, .el-toolbar')
    otherElements.forEach(el => {
      (el as HTMLElement).style.display = 'none'
    })

    // 5. 执行打印（添加print-js的回调双重保险）
    printJsAny({
      printable: 'printContractTemplate',
      type: 'html',
      header: '合同正式文件',
      headerStyle: 'font-size: 20px; font-weight: 700; text-align: center; margin-bottom: 30px; color: #333;',
      targetStyles: ['*'],
      maxWidth: 800,
      scanStyles: true,
      silent: false,
      timeout: 1000,
      // 🔥 关键修复2：print-js的对话框关闭回调（双重保险）
      onPrintDialogClose: handleRefresh,
      onError: (error: any) => {
        ElMessage.error(`打印失败：${error.message || '未知错误'}`)
        console.error('打印异常：', error)
        handleRefresh() // 错误时强制刷新
      }
    })

    // 🔥 关键修复3：极端场景兜底（5秒后强制刷新）
    setTimeout(() => {
      if (!refreshTriggered) {
        console.log('极端场景：5秒后强制刷新')
        handleRefresh()
      }
    }, 5000)
  } catch (error: any) {
    ElMessage.error(`打印处理失败：${error.message || '系统异常'}`)
    console.error('打印流程异常：', error)
    // 异常时强制刷新
    setTimeout(() => {
      window.location.reload()
    }, 50)
  }
}
</script>

<style scoped>
/* 打印按钮间距 */
::v-deep(.ml-2) {
  margin-left: 8px !important;
}

/* 模板默认隐藏 */
.print-template {
  display: none;
  width: 100%;
}

/* 打印专用样式 */
@media print {
  body {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
    margin: 0;
    padding: 40px 0;
    background: #fff;
    font-family: "Microsoft YaHei", sans-serif;
  }

  /* 强制显示模板 */
  #printContractTemplate.print-template {
    display: block !important;
    width: 100% !important;
  }

  /* 精准隐藏其他元素 */
  .table-box > :not(#printContractTemplate),
  .el-drawer, .el-dialog, .el-header, .el-footer, .el-menu, .el-toolbar, .el-container > :not(.table-box) {
    display: none !important;
  }

  /* 纸张配置 */
  @page {
    margin: 1.5cm;
    size: A4 portrait;
  }

  /* 移除浏览器默认页眉页脚 */
  body::before, body::after {
    content: none !important;
  }

  /* 打印模板内部样式 */
  .print-container {
    width: 90% !important;
    margin: 0 auto !important;
  }

  .print-title {
    text-align: center !important;
    font-size: 24px !important;
    font-weight: 700 !important;
    margin: 30px 0 !important;
    padding-bottom: 10px !important;
    border-bottom: 1px solid #333 !important;
    color: #333 !important;
  }

  .print-info {
    width: 80% !important;
    margin: 0 auto !important;
  }

  .print-row {
    margin: 15px 0 !important;
    display: flex !important;
    align-items: center !important;
    line-height: 1.8 !important;
    font-size: 14px !important;
    color: #666 !important;
  }

  .print-label {
    width: 120px !important;
    font-weight: 600 !important;
    color: #333 !important;
    flex-shrink: 0 !important;
  }

  .print-sign-area {
    margin-top: 80px !important;
    display: flex !important;
    justify-content: space-between !important;
    width: 80% !important;
    margin-left: auto !important;
    margin-right: auto !important;
    font-size: 14px !important;
    color: #333 !important;
  }
}
</style>