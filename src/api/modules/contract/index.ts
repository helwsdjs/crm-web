import { COMMON_ADMIN_API } from '@/api/axios/servicePort'
import http from '@/api'

export const ContractApi = {
  page: (params: any) => http.post(COMMON_ADMIN_API + '/contract/page', params),
  saveOrEdit: (params: any) => http.post(COMMON_ADMIN_API + '/contract/saveOrUpdate', params),
  getContractProduct: (contractId: number) => http.post(
    COMMON_ADMIN_API + '/contract/getContractProduct',
    {}, // post 请求体（后端不需要，传空对象）
    { params: { contractId } } // 查询参数（拼在 URL 上）
  )
}
