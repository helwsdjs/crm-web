<template>
  <div class="upload-box">
    <el-upload
      action="#"
      :id="uuid"
      :class="['upload', self_disabled ? 'disabled' : '', drag ? 'no-border' : '']"
      :multiple="false"
      :disabled="self_disabled"
      :show-file-list="false"
      :http-request="handleHttpUpload"
      :before-upload="beforeUpload"
      :on-success="uploadSuccess"
      :on-error="uploadError"
      :drag="drag"
      :accept="fileType.join(',')"
    >
      <template v-if="imageUrl">
        <img :src="imageUrl" class="upload-image" />
        <div class="upload-handle" @click.stop>
          <div class="handle-icon" @click="editImg" v-if="!self_disabled">
            <el-icon><Edit /></el-icon>
            <span>编辑</span>
          </div>
          <div class="handle-icon" @click="imgViewVisible = true">
            <el-icon><ZoomIn /></el-icon>
            <span>查看</span>
          </div>
          <div class="handle-icon" @click="deleteImg" v-if="!self_disabled">
            <el-icon><Delete /></el-icon>
            <span>删除</span>
          </div>
        </div>
      </template>
      <template v-else>
        <div class="upload-empty">
          <slot name="empty">
            <el-icon><Plus /></el-icon>
          </slot>
        </div>
      </template>
    </el-upload>
    <div class="el-upload__tip">
      <slot name="tip"></slot>
    </div>
    <el-image-viewer v-if="imgViewVisible" @close="imgViewVisible = false" :url-list="[imageUrl]" />
  </div>
</template>

<script setup lang="ts" name="UploadImg">
import { ref, computed, inject } from 'vue'
// 导入你的 uploadFile 对象（包含 uploadImage 方法）
import { uploadFile } from '@/api/modules/upload/uploadFile'
import { generateUUID } from '@/utils/util'
import { ElNotification, formContextKey, formItemContextKey } from 'element-plus'
import type { UploadProps, UploadRequestOptions } from 'element-plus'
// 导入图标组件（确保已引入）
import { Edit, ZoomIn, Delete, Plus } from '@element-plus/icons-vue'

// 定义支持的文件类型
type FileTypes = 'image/apng' | 'image/bmp' | 'image/gif' | 'image/jpeg' | 'image/pjpeg' | 'image/png' | 'image/svg+xml' | 'image/tiff' | 'image/webp' | 'image/x-icon'

// 定义 props 类型：明确 api 是「包含 uploadImage 方法的对象」（与你的 uploadFile 结构一致）
interface UploadFileProps {
  imageUrl: string // 图片地址（必传）
  // api 可选，格式与 uploadFile 一致（包含 uploadImage 方法）
  api?: {
    uploadImage: (params: FormData) => Promise<any>
    uploadMultiImage?: (params: FormData) => Promise<any>
  }
  drag?: boolean // 是否支持拖拽（默认 true）
  disabled?: boolean // 是否禁用（默认 false）
  fileSize?: number // 图片大小限制（默认 5M）
  fileType?: FileTypes[] // 图片类型限制（默认 jpeg/png/gif）
  height?: string // 组件高度（默认 150px）
  width?: string // 组件宽度（默认 150px）
  borderRadius?: string // 边框圆角（默认 8px）
}

// 接受父组件参数并设置默认值
const props = withDefaults(defineProps<UploadFileProps>(), {
  imageUrl: '',
  drag: true,
  disabled: false,
  fileSize: 5,
  fileType: () => ['image/jpeg', 'image/png', 'image/gif'],
  height: '150px',
  width: '150px',
  borderRadius: '8px'
})

// 生成组件唯一id
const uuid = ref('id-' + generateUUID())
// 查看图片弹窗状态
const imgViewVisible = ref(false)
// 获取 el-form 上下文（用于表单校验）
const formContext = inject(formContextKey, void 0)
// 获取 el-form-item 上下文（用于表单校验）
const formItemContext = inject(formItemContextKey, void 0)

// 判断是否禁用上传和删除
const self_disabled = computed(() => {
  return props.disabled || formContext?.disabled
})

// 定义 emits 类型
interface UploadEmits {
  (e: 'update:imageUrl', value: string): void
  (e: 'check-validate'): void
}
const emit = defineEmits<UploadEmits>()

/**
 * 图片上传逻辑（核心修改：适配 uploadFile 对象的调用方式）
 */
const handleHttpUpload = async (options: UploadRequestOptions) => {
  const formData = new FormData()
  formData.append('file', options.file)

  try {
    // 优先使用父组件传入的 api，默认使用 uploadFile 对象的 uploadImage 方法
    const uploadApi = props.api ?? uploadFile
    // 调用对象中的 uploadImage 方法（与你的 uploadFile 结构匹配）
    const { data } = await uploadApi.uploadImage(formData)

    // 上传成功：更新图片地址 + 触发表单校验
    emit('update:imageUrl', data.fileUrl)
    if (formItemContext?.prop && formContext) {
      formContext.validateField([formItemContext.prop as string])
    }
    emit('check-validate')

  } catch (error) {
    // 上传失败：触发错误回调
    options.onError(error as any)
  }
}

/**
 * 删除图片（清空图片地址）
 */
const deleteImg = () => {
  emit('update:imageUrl', '')
}

/**
 * 编辑图片（触发上传按钮点击）
 */
const editImg = () => {
  const uploadInput = document.querySelector(`#${uuid.value} .el-upload__input`)
  uploadInput && uploadInput.dispatchEvent(new MouseEvent('click'))
}

/**
 * 上传前校验（文件类型 + 大小）
 */
const beforeUpload: UploadProps['beforeUpload'] = (rawFile) => {
  // 校验文件类型
  const isTypeValid = props.fileType.includes(rawFile.type as FileTypes)
  if (!isTypeValid) {
    ElNotification({
      title: '温馨提示',
      message: '上传图片不符合所需格式（仅支持 jpeg/png/gif）！',
      type: 'warning'
    })
  }

  // 校验文件大小（转换为 MB）
  const isSizeValid = rawFile.size / 1024 / 1024 < props.fileSize
  if (!isSizeValid) {
    ElNotification({
      title: '温馨提示',
      message: `上传图片大小不能超过 ${props.fileSize}M！`,
      type: 'warning'
    })
  }

  return isTypeValid && isSizeValid
}

// 上传成功提示
const uploadSuccess = () => {
  ElNotification({
    title: '温馨提示',
    message: '图片上传成功！',
    type: 'success'
  })
}

// 上传失败提示
const uploadError = () => {
  ElNotification({
    title: '温馨提示',
    message: '图片上传失败，请您重新上传！',
    type: 'error'
  })
}
</script>

<style scoped lang="less">
/* 保持你原有的样式不变 */
.is-error {
  .upload {
    :deep(.el-upload),
    :deep(.el-upload-dragger) {
      border: 1px dashed var(--el-color-danger) !important;

      &:hover {
        border-color: var(--el-color-primary) !important;
      }
    }
  }
}

:deep(.disabled) {
  .el-upload,
  .el-upload-dragger {
    cursor: not-allowed !important;
    background: var(--el-disabled-bg-color);
    border: 1px dashed var(--el-border-color-darker) !important;

    &:hover {
      border: 1px dashed var(--el-border-color-darker) !important;
    }
  }
}

.upload-box {
  .no-border {
    :deep(.el-upload) {
      border: none !important;
    }
  }

  :deep(.upload) {
    .el-upload {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: v-bind(width);
      height: v-bind(height);
      overflow: hidden;
      border: 1px dashed var(--el-border-color-darker);
      border-radius: v-bind(borderRadius);
      transition: var(--el-transition-duration-fast);

      &:hover {
        border-color: var(--el-color-primary);

        .upload-handle {
          opacity: 1;
        }
      }

      .el-upload-dragger {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        padding: 0;
        overflow: hidden;
        background-color: transparent;
        border: 1px dashed var(--el-border-color-darker);
        border-radius: v-bind(borderRadius);

        &:hover {
          border: 1px dashed var(--el-color-primary);
        }
      }

      .el-upload-dragger.is-dragover {
        background-color: var(--el-color-primary-light-9);
        border: 2px dashed var(--el-color-primary) !important;
      }

      .upload-image {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      .upload-empty {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        line-height: 30px;
        color: var(--el-color-info);

        .el-icon {
          font-size: 28px;
          color: var(--el-text-color-secondary);
        }
      }

      .upload-handle {
        position: absolute;
        top: 0;
        right: 0;
        display: flex;
        width: 100%;
        height: 100%;
        cursor: pointer;
        background: rgb(0 0 0 / 60%);
        opacity: 0;
        box-sizing: border-box;
        transition: var(--el-transition-duration-fast);
        align-items: center;
        justify-content: center;

        .handle-icon {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 0 6%;
          color: aliceblue;

          .el-icon {
            margin-bottom: 40%;
            font-size: 130%;
            line-height: 130%;
          }

          span {
            font-size: 85%;
            line-height: 85%;
          }
        }
      }
    }
  }

  .el-upload__tip {
    line-height: 18px;
    text-align: center;
  }
}
</style>