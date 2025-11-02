// src/api/modules/upload.ts
import { COMMON_ADMIN_API } from '@/api/axios/servicePort'
import http from '@/api'

/**
 * @name 上传相关接口（图片/文件）
 */
export const uploadFile = {
  // 单张图片上传（商品封面图等场景）
  uploadImage: (params: FormData) => http.post(
    COMMON_ADMIN_API + '/oss/upload', // 后端图片上传接口地址，需替换为你的实际接口
    params,
    {
      headers: {
        'Content-Type': 'multipart/form-data' // 上传文件必须指定此类型
      }
    }
  ),

  // 如需多图上传可添加此方法
  uploadMultiImage: (params: FormData) => http.post(
    COMMON_ADMIN_API + '/upload/multi-image', // 后端多图上传接口
    params,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  )
}