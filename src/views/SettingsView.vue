<template>
  <div class="page-shell">
    <PageHeader title="系统设置" description="配置小程序展示、售后服务与微信支付">
      <a-button :loading="loading" @click="load"><ReloadOutlined /> 放弃修改</a-button>
      <a-button type="primary" :loading="saving" @click="save"><SaveOutlined /> 保存全部设置</a-button>
    </PageHeader>

    <a-alert
      type="warning"
      show-icon
      message="AppSecret 和支付密钥属于敏感信息"
      description="输入内容已隐藏，请只向必要的管理员开放本页面。"
    />

    <a-skeleton v-if="loading" active :paragraph="{ rows: 14 }" />
    <a-card v-else class="settings-card surface-card" :bordered="false">
      <a-tabs v-model:active-key="tab" tab-position="left" class="settings-tabs">
        <a-tab-pane key="store">
          <template #tab><span><MobileOutlined /> 小程序展示</span></template>
          <div class="settings-content settings-content--wide">
            <div class="section-intro">
              <h2>小程序展示</h2>
              <p>分区管理通用展示、首页内容与 DIY 页面资源。</p>
            </div>

            <a-alert
              :type="storageAlertType"
              show-icon
              :message="storageAlertMessage"
              :description="storageAlertDescription"
            >
              <template #action><a-button size="small" @click="loadStorageStatus">刷新</a-button></template>
            </a-alert>

            <section class="theme-switcher">
              <div class="theme-switcher__heading">
                <div>
                  <span>THEME PRESET</span>
                  <h3>页面风格</h3>
                  <p>点击后同步替换主题颜色、配套图片、首页轮播与分享展示文案。</p>
                </div>
                <span class="theme-switcher__status" :class="{ 'is-dirty': themePresetDirty }">
                  {{ themePresetDirty ? '待保存' : '已同步' }}
                </span>
              </div>

              <div class="theme-choice-row" role="group" aria-label="页面风格">
                <button
                  v-for="option in themeOptions"
                  :key="option.value"
                  type="button"
                  class="theme-choice"
                  :class="{ 'is-selected': form.miniprogram_theme_key === option.value }"
                  :aria-label="`应用${option.label}`"
                  :aria-pressed="form.miniprogram_theme_key === option.value"
                  @click="handleThemeChange(option.value)"
                >
                  <span class="theme-choice__swatches" aria-hidden="true">
                    <i v-for="color in option.colors" :key="color" :style="{ backgroundColor: color }" />
                  </span>
                  <span class="theme-choice__title">
                    {{ option.label }}
                    <span v-if="form.miniprogram_theme_key === option.value" class="theme-choice__selected">
                      <CheckOutlined />
                    </span>
                  </span>
                  <small>{{ option.description }}</small>
                </button>
              </div>

              <a-alert
                v-if="themePresetDirty"
                class="theme-preset-notice"
                type="warning"
                show-icon
                message="主题颜色、配套图片和主题文案已填入当前表单，尚未生效"
                description="请检查下方内容并点击“保存全部设置”。珠盘、客服二维码、音乐和业务数据不会被替换。"
              />
              <div class="field-help">主题会带入已有的配套图片和文案；暂未制作的主题资源会保持为空，不会误用其他风格图片。再次点击当前风格可恢复预设。</div>
            </section>

            <div class="setting-area-heading setting-area-heading--first">
              <div>
                <span>COMMON</span>
                <h3>通用展示</h3>
              </div>
              <p>用于多个小程序页面共同展示的品牌与客服资料。</p>
            </div>

            <section class="setting-section">
              <h3 class="setting-section-title">品牌资料</h3>
              <a-form-item label="小程序名称">
                <a-input v-model:value="form.miniprogram_name" placeholder="显示在小程序首页的名称" />
              </a-form-item>
              <div class="form-grid">
                <a-form-item label="首页默认用户名称">
                  <a-input v-model:value="form.miniprogram_home_identity_name" :maxlength="12" show-count placeholder="例如：御石灵友" />
                  <div class="field-help">用户未登录或未设置有效昵称时，首页个人入口显示此名称。</div>
                </a-form-item>
                <a-form-item label="DIY 页面标题">
                  <a-input v-model:value="form.miniprogram_diy_page_title" :maxlength="12" show-count placeholder="例如：晶石实验室" />
                  <div class="field-help">显示在 DIY 编辑页顶部居中位置。</div>
                </a-form-item>
              </div>
              <a-form-item label="小程序 Logo / 默认头像">
                <ImageUploader v-model="form.site_title_logo_image" />
                <div class="field-help">用于小程序品牌标识；用户没有设置头像时也显示这张图。</div>
              </a-form-item>
            </section>

            <section class="setting-section">
              <h3 class="setting-section-title">启动加载页</h3>
              <a-form-item label="加载页背景图">
                <ImageUploader v-model="form.miniprogram_launch_background_image" />
                <div class="field-help">建议上传 9:16 竖图并控制在 500KB 内；首次安装或图片加载失败时使用小程序内置背景图。</div>
              </a-form-item>
            </section>

            <section class="setting-section">
              <h3 class="setting-section-title">品牌与客服</h3>
              <div class="form-grid">
                <a-form-item label="客服悬浮图">
                  <ImageUploader v-model="form.miniprogram_customer_service_float_image" />
                  <div class="field-help">建议上传 256 × 256 的透明 PNG，不要带“客服”文字。</div>
                </a-form-item>
                <a-form-item label="客服微信号">
                  <a-input v-model:value="contact.wechatId" placeholder="客服微信号" />
                </a-form-item>
                <a-form-item class="form-grid__wide" label="客服微信二维码">
                  <div class="contact-qr-list">
                    <div v-for="(item, index) in contactQrs" :key="item.rowKey" class="contact-qr-row">
                      <div class="contact-qr-order">{{ index + 1 }}</div>
                      <ImageUploader v-model="item.image" />
                      <a-button danger title="删除" @click="removeContactQr(item.rowKey)">
                        <DeleteOutlined />
                      </a-button>
                    </div>
                    <a-button type="dashed" block :disabled="contactQrs.length >= 10" @click="addContactQr">
                      <PlusOutlined /> 添加客服二维码
                    </a-button>
                    <div class="field-help">最多配置 10 个；用户每次打开客服弹窗时随机展示其中一个。</div>
                  </div>
                </a-form-item>
              </div>
            </section>

            <div class="setting-area-heading">
              <div>
                <span>HOME</span>
                <h3>首页部分</h3>
              </div>
              <p>配置首页首屏、入口、流程图片与全局背景音乐。</p>
            </div>

            <section class="setting-section">
              <div class="section-toolbar">
                <div>
                  <h3 class="setting-section-title">首页轮播图</h3>
                  <p>最多 5 张；配置图片、短标签、标题和说明，“开始定制”按钮由小程序固定。</p>
                </div>
                <a-button type="primary" ghost :disabled="slides.length >= 5" @click="addSlide"><PlusOutlined /> 添加轮播</a-button>
              </div>

              <a-table
                class="slide-table"
                :columns="slideColumns"
                :data-source="slides"
                :pagination="false"
                :scroll="{ x: 1160 }"
                row-key="rowKey"
                size="middle"
              >
                <template #emptyText>
                  <a-empty description="暂无轮播图，点击“添加轮播”开始配置" />
                </template>
                <template #bodyCell="{ column, record, index }">
                  <template v-if="column.key === 'image'">
                    <div class="slide-image-cell">
                      <div class="slide-image-preview">
                        <img v-if="record.image" :src="resolveMedia(record.image)" alt="轮播图预览" />
                        <PictureOutlined v-else />
                      </div>
                      <div class="slide-image-inputs">
                        <a-input v-model:value="record.image" placeholder="图片地址或上传图片" @blur="record.image = normalizeSlideImage(record.image)" />
                        <a-upload
                          :show-upload-list="false"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          :before-upload="validateSlideFile"
                          :custom-request="(options: any) => uploadSlide(options, record)"
                        >
                          <a-button size="small" :loading="uploadingSlideKey === record.rowKey">
                            <UploadOutlined /> 上传图片
                          </a-button>
                        </a-upload>
                      </div>
                    </div>
                  </template>
                  <template v-else-if="column.key === 'eyebrow'">
                    <a-textarea v-model:value="record.eyebrow" :auto-size="{ minRows: 2, maxRows: 3 }" maxlength="40" placeholder="MORNING NOTE · 今日推荐" />
                  </template>
                  <template v-else-if="column.key === 'title'">
                    <a-textarea v-model:value="record.title" :auto-size="{ minRows: 2, maxRows: 3 }" placeholder="例如：定义你的专属串珠" />
                  </template>
                  <template v-else-if="column.key === 'description'">
                    <a-textarea v-model:value="record.description" :auto-size="{ minRows: 2, maxRows: 4 }" placeholder="轮播图说明文案" />
                  </template>
                  <template v-else-if="column.key === 'enabled'">
                    <a-switch v-model:checked="record.enabled" checked-children="展示" un-checked-children="停用" />
                  </template>
                  <template v-else-if="column.key === 'actions'">
                    <a-space>
                      <a-button size="small" :disabled="index === 0" title="上移" @click="moveSlide(index, -1)"><ArrowUpOutlined /></a-button>
                      <a-button size="small" :disabled="index === slides.length - 1" title="下移" @click="moveSlide(index, 1)"><ArrowDownOutlined /></a-button>
                      <a-button size="small" danger title="删除" @click="removeSlide(record.rowKey)"><DeleteOutlined /></a-button>
                    </a-space>
                  </template>
                </template>
              </a-table>
              <div class="field-help">支持 JPG、PNG、GIF、WebP，单张不超过 5 MB。保存后由 /api/settings/public 提供给小程序。</div>
            </section>

            <section class="setting-section">
              <div class="section-toolbar">
                <div>
                  <h3 class="setting-section-title">首页主要入口</h3>
                  <p>固定对应“开始手作”和“制作同款”，这里只更换图片，不改变页面跳转。</p>
                </div>
              </div>
              <div class="asset-grid asset-grid--two">
                <a-form-item v-for="item in mainEntrySlots" :key="item.key" :label="item.label">
                  <ImageUploader v-model="item.image" />
                  <div class="field-help">{{ item.help }}</div>
                </a-form-item>
              </div>
            </section>

            <section class="setting-section">
              <div class="section-toolbar">
                <div>
                  <h3 class="setting-section-title">首页快捷入口</h3>
                  <p>四张图片依次对应灵感图鉴、购物车、我的订单和我的设计。</p>
                </div>
              </div>
              <div class="asset-grid asset-grid--two">
                <a-form-item v-for="item in shortcutSlots" :key="item.key" :label="item.label">
                  <ImageUploader v-model="item.image" />
                  <div class="field-help">建议上传 512 × 512 的 JPG 或 PNG。</div>
                </a-form-item>
              </div>
            </section>

            <section class="setting-section">
              <h3 class="setting-section-title">首页活动专区</h3>
              <a-form-item label="灵感分享计划背景图">
                <ImageUploader v-model="form.miniprogram_home_activity_image" />
                <div class="field-help">首页活动卡片、活动详情页顶部和微信分享封面共用；未配置时不显示图片。</div>
              </a-form-item>

              <div class="activity-config-block">
                <div class="section-toolbar">
                  <div>
                    <h3 class="setting-section-title">奖励阶梯</h3>
                    <p>每档只配置点赞数、播放量和累计奖励；小程序自动补充单位与千分位。</p>
                  </div>
                  <a-button type="primary" ghost :disabled="activityRewardTiers.length >= 10" @click="addActivityRewardTier">
                    <PlusOutlined /> 添加阶梯
                  </a-button>
                </div>
                <div class="activity-config-list">
                  <div v-for="(item, index) in activityRewardTiers" :key="item.rowKey" class="activity-reward-config-row">
                    <div class="activity-config-order">{{ String(index + 1).padStart(2, '0') }}</div>
                    <a-form-item label="点赞数">
                      <a-input-number v-model:value="item.likes" :min="1" :precision="0" :controls="false" placeholder="例如 30" />
                    </a-form-item>
                    <a-form-item label="播放量">
                      <a-input-number v-model:value="item.views" :min="1" :precision="0" :controls="false" placeholder="例如 1000" />
                    </a-form-item>
                    <a-form-item label="累计奖励（元）">
                      <a-input-number v-model:value="item.reward" :min="1" :precision="0" :controls="false" placeholder="例如 10" />
                    </a-form-item>
                    <a-space class="activity-config-actions">
                      <a-button size="small" :disabled="index === 0" title="上移" @click="moveActivityRewardTier(index, -1)"><ArrowUpOutlined /></a-button>
                      <a-button size="small" :disabled="index === activityRewardTiers.length - 1" title="下移" @click="moveActivityRewardTier(index, 1)"><ArrowDownOutlined /></a-button>
                      <a-button size="small" danger :disabled="activityRewardTiers.length <= 1" title="删除" @click="removeActivityRewardTier(index)"><DeleteOutlined /></a-button>
                    </a-space>
                  </div>
                </div>
              </div>

              <div class="activity-config-block">
                <div class="section-toolbar">
                  <div>
                    <h3 class="setting-section-title">发布要求</h3>
                    <p>每项仅展示标题和说明，顺序与这里保持一致。</p>
                  </div>
                  <a-button type="primary" ghost :disabled="activityRequirements.length >= 10" @click="addActivityRequirement">
                    <PlusOutlined /> 添加要求
                  </a-button>
                </div>
                <div class="activity-config-list">
                  <div v-for="(item, index) in activityRequirements" :key="item.rowKey" class="activity-requirement-config-row">
                    <div class="activity-config-order">{{ String(index + 1).padStart(2, '0') }}</div>
                    <div class="activity-requirement-fields">
                      <a-form-item label="标题">
                        <a-input v-model:value="item.title" :maxlength="30" show-count placeholder="例如：完整记录创作过程" />
                      </a-form-item>
                      <a-form-item label="说明">
                        <a-textarea v-model:value="item.description" :maxlength="300" show-count :auto-size="{ minRows: 2, maxRows: 5 }" placeholder="填写这一项的具体要求" />
                      </a-form-item>
                    </div>
                    <a-space class="activity-config-actions">
                      <a-button size="small" :disabled="index === 0" title="上移" @click="moveActivityRequirement(index, -1)"><ArrowUpOutlined /></a-button>
                      <a-button size="small" :disabled="index === activityRequirements.length - 1" title="下移" @click="moveActivityRequirement(index, 1)"><ArrowDownOutlined /></a-button>
                      <a-button size="small" danger :disabled="activityRequirements.length <= 1" title="删除" @click="removeActivityRequirement(index)"><DeleteOutlined /></a-button>
                    </a-space>
                  </div>
                </div>
              </div>
            </section>

            <section class="setting-section">
              <h3 class="setting-section-title">首页制作流程</h3>
              <a-form-item label="制作与交付流程长图">
                <ImageUploader v-model="form.miniprogram_home_process_image" />
                <div class="field-help">建议上传 900 × 1896 的 JPG；首页显示顶部预览，点击后查看完整长图。</div>
              </a-form-item>
            </section>

            <section class="setting-section">
              <h3 class="setting-section-title">首页音乐</h3>
              <a-form-item label="背景音乐">
                <AudioUploader v-model="form.miniprogram_home_music_url" />
                <div class="field-help">上传成功后自动回填地址；也可手动填写 HTTPS MP3 地址。留空时首页不显示音乐按钮。</div>
              </a-form-item>
            </section>

            <div class="setting-area-heading">
              <div>
                <span>MALL</span>
                <h3>商城页面部分</h3>
              </div>
              <p>配置商城浏览页的顶部展示资源。</p>
            </div>

            <section class="setting-section">
              <h3 class="setting-section-title">商城顶部展示</h3>
              <a-form-item label="顶部背景图">
                <ImageUploader v-model="form.miniprogram_mall_hero_image" />
                <div class="field-help">建议上传约 3:1 的横向 JPG 或 WebP；未配置时不显示图片。</div>
              </a-form-item>
            </section>

            <div class="setting-area-heading">
              <div>
                <span>DIY STUDIO</span>
                <h3>DIY 页面部分</h3>
              </div>
              <p>配置 DIY 编辑器的珠盘背景，发现页会复用排在第一位的珠盘。</p>
            </div>

            <section class="setting-section">
              <div class="section-toolbar">
                <div>
                  <h3 class="setting-section-title">珠盘背景图</h3>
                  <p>最多 5 张，DIY 页面按当前顺序切换；第一张同时作为发现页设计卡片的盘子图。</p>
                </div>
                <a-button type="primary" ghost :disabled="trayImages.length >= 5" @click="addTrayImage"><PlusOutlined /> 添加珠盘</a-button>
              </div>

              <a-table
                class="slide-table tray-table"
                :columns="trayColumns"
                :data-source="trayImages"
                :pagination="false"
                row-key="rowKey"
                size="middle"
              >
                <template #emptyText>
                  <a-empty description="尚未配置，将继续使用小程序内置珠盘图" />
                </template>
                <template #bodyCell="{ column, record, index }">
                  <template v-if="column.key === 'order'">
                    <div class="tray-order-cell">
                      <strong>{{ index + 1 }}</strong>
                      <a-tag v-if="index === 0" color="green">发现页底图</a-tag>
                    </div>
                  </template>
                  <template v-else-if="column.key === 'image'">
                    <div class="slide-image-cell">
                      <div class="slide-image-preview slide-image-preview--tray">
                        <img v-if="record.image" :src="resolveMedia(record.image)" alt="珠盘图预览" />
                        <PictureOutlined v-else />
                      </div>
                      <div class="slide-image-inputs">
                        <a-input v-model:value="record.image" placeholder="图片地址或上传图片" @blur="record.image = normalizeSlideImage(record.image)" />
                        <a-upload
                          :show-upload-list="false"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          :before-upload="validateSlideFile"
                          :custom-request="(options: any) => uploadTrayImage(options, record)"
                        >
                          <a-button size="small" :loading="uploadingTrayKey === record.rowKey"><UploadOutlined /> 上传图片</a-button>
                        </a-upload>
                      </div>
                    </div>
                  </template>
                  <template v-else-if="column.key === 'actions'">
                    <a-space>
                      <a-button size="small" :disabled="index === 0" title="上移" @click="moveTrayImage(index, -1)"><ArrowUpOutlined /></a-button>
                      <a-button size="small" :disabled="index === trayImages.length - 1" title="下移" @click="moveTrayImage(index, 1)"><ArrowDownOutlined /></a-button>
                      <a-button size="small" danger title="删除" @click="removeTrayImage(record.rowKey)"><DeleteOutlined /></a-button>
                    </a-space>
                  </template>
                </template>
              </a-table>
              <div class="field-help">建议上传正方形 JPG 或 PNG，主体居中且四周留白；列表为空时小程序自动使用内置珠盘图。</div>
            </section>

            <section class="setting-section">
              <h3 class="setting-section-title">手围测量示意图</h3>
              <a-form-item label="测量方法图">
                <ImageUploader data-testid="wrist-measurement-uploader" v-model="form.miniprogram_wrist_measurement_image" />
                <div class="field-help">用于“使用指南－手围测量”，小程序会按图片宽度完整展示。建议上传约 1200 × 2100 的竖向 JPG 或 WebP，并保证文字和表格清晰可读。</div>
              </a-form-item>
            </section>

            <section class="setting-section">
              <div class="section-toolbar">
                <div>
                  <h3 class="setting-section-title">分享展示配置</h3>
                  <p>用于 DIY 页面作品展示状态的分享文案。</p>
                </div>
              </div>
              <div class="form-grid">
                <a-form-item label="短标签">
                  <a-input
                    v-model:value="form.miniprogram_diy_showcase_eyebrow"
                    maxlength="32"
                    show-count
                    placeholder="例如：MY CRYSTAL · 今日作品"
                  />
                </a-form-item>
                <a-form-item label="主标题">
                  <a-input
                    v-model:value="form.miniprogram_diy_showcase_title"
                    maxlength="24"
                    show-count
                    placeholder="例如：把喜欢的光，串成日常"
                  />
                </a-form-item>
              </div>
              <a-form-item label="说明文字">
                <a-input
                  v-model:value="form.miniprogram_diy_showcase_description"
                  maxlength="40"
                  show-count
                  placeholder="例如：一串一念，留住此刻的温柔。"
                />
              </a-form-item>
            </section>

          </div>
        </a-tab-pane>

        <a-tab-pane key="service">
          <template #tab><span><CustomerServiceOutlined /> 用户售后与服务</span></template>
          <div class="settings-content">
            <div class="section-intro">
              <h2>用户售后与服务</h2>
              <p>配置小程序购买须知、退款售后和实时物流查询。</p>
            </div>

            <section class="setting-section">
              <div class="section-toolbar">
                <div>
                  <h3 class="setting-section-title">购买须知图片</h3>
                  <p>小程序按当前顺序展示，适合上传排版完整的须知长图；未配置时不显示购买须知。</p>
                </div>
                <a-button type="primary" ghost :disabled="purchaseNoticeImages.length >= 10" @click="addPurchaseNoticeImage">
                  <PlusOutlined /> 添加图片
                </a-button>
              </div>

              <a-table
                class="slide-table purchase-notice-table"
                :columns="purchaseNoticeColumns"
                :data-source="purchaseNoticeImages"
                :pagination="false"
                row-key="rowKey"
                size="middle"
              >
                <template #emptyText>
                  <a-empty description="尚未配置，小程序不会显示购买须知区域" />
                </template>
                <template #bodyCell="{ column, record, index }">
                  <template v-if="column.key === 'order'">
                    <div class="tray-order-cell">
                      <strong>{{ index + 1 }}</strong>
                    </div>
                  </template>
                  <template v-else-if="column.key === 'image'">
                    <div class="slide-image-cell">
                      <div class="slide-image-preview slide-image-preview--notice">
                        <img v-if="record.image" :src="resolveMedia(record.image)" alt="购买须知图片预览" />
                        <PictureOutlined v-else />
                      </div>
                      <div class="slide-image-inputs">
                        <a-input v-model:value="record.image" placeholder="图片地址或上传图片" @blur="record.image = normalizeSlideImage(record.image)" />
                        <a-upload
                          :show-upload-list="false"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          :before-upload="validateSlideFile"
                          :custom-request="(options: any) => uploadPurchaseNoticeImage(options, record)"
                        >
                          <a-button size="small" :loading="uploadingPurchaseNoticeKey === record.rowKey"><UploadOutlined /> 上传图片</a-button>
                        </a-upload>
                      </div>
                    </div>
                  </template>
                  <template v-else-if="column.key === 'actions'">
                    <a-space>
                      <a-button size="small" :disabled="index === 0" title="上移" @click="movePurchaseNoticeImage(index, -1)"><ArrowUpOutlined /></a-button>
                      <a-button size="small" :disabled="index === purchaseNoticeImages.length - 1" title="下移" @click="movePurchaseNoticeImage(index, 1)"><ArrowDownOutlined /></a-button>
                      <a-button size="small" danger title="删除" @click="removePurchaseNoticeImage(record.rowKey)"><DeleteOutlined /></a-button>
                    </a-space>
                  </template>
                </template>
              </a-table>
              <div class="field-help">最多 10 张，建议使用同宽图片；小程序会按顺序等宽展示。</div>
            </section>

            <section class="setting-section">
              <h3 class="setting-section-title">售后服务</h3>
              <a-form-item label="用户可选退款原因">
                <div class="refund-reason-list">
                  <div v-for="(reason, index) in refundReasons" :key="index" class="refund-reason-row">
                    <span class="refund-reason-order">{{ index + 1 }}</span>
                    <a-input v-model:value="refundReasons[index]" maxlength="20" placeholder="例如：质量问题" />
                    <a-space>
                      <a-button size="small" :disabled="index === 0" title="上移" @click="moveRefundReason(index, -1)"><ArrowUpOutlined /></a-button>
                      <a-button size="small" :disabled="index === refundReasons.length - 1" title="下移" @click="moveRefundReason(index, 1)"><ArrowDownOutlined /></a-button>
                      <a-button size="small" danger :disabled="refundReasons.length <= 1" title="删除" @click="removeRefundReason(index)"><DeleteOutlined /></a-button>
                    </a-space>
                  </div>
                  <a-button type="dashed" block :disabled="refundReasons.length >= 10" @click="addRefundReason"><PlusOutlined /> 添加退款原因</a-button>
                </div>
                <div class="field-help">小程序申请售后时显示，最多 10 项；选择“其他问题”时用户必须填写详细说明。</div>
              </a-form-item>
              <a-form-item label="售后退货地址">
                <a-textarea
                  v-model:value="form.refund_return_address"
                  :rows="4"
                  placeholder="收件人、电话、详细地址和注意事项"
                />
                <div class="field-help">用于用户退货时展示收件信息，请填写完整联系人、电话和地址。</div>
              </a-form-item>
            </section>

            <section class="setting-section">
              <div class="switch-heading">
                <div>
                  <h3 class="setting-section-title">物流查询（快递100）</h3>
                  <p>用于小程序“查看物流”展示实时运输轨迹。</p>
                </div>
                <a-switch v-model:checked="form.kuaidi100_enabled" checked-children="启用" un-checked-children="停用" />
              </div>
              <div class="form-grid">
                <a-form-item label="授权 Key">
                  <a-input-password
                    v-model:value="form.kuaidi100_key"
                    name="kuaidi100-key"
                    autocomplete="new-password"
                    placeholder="快递100企业管理后台的授权 Key"
                  />
                </a-form-item>
                <a-form-item label="Customer">
                  <a-input-password
                    v-model:value="form.kuaidi100_customer"
                    name="kuaidi100-customer"
                    autocomplete="new-password"
                    placeholder="快递100企业管理后台的 Customer"
                  />
                </a-form-item>
                <a-form-item label="查询缓存时间">
                  <a-input-number
                    v-model:value="form.kuaidi100_cache_minutes"
                    :min="30"
                    :max="1440"
                    :precision="0"
                    addon-after="分钟"
                    style="width: 100%"
                  />
                  <div class="field-help">同一运单至少间隔 30 分钟查询，避免重复消耗查询次数。</div>
                </a-form-item>
              </div>
              <a-alert
                type="info"
                show-icon
                message="这里只需要授权 Key 和 Customer，不需要保存快递100登录账号或密码。顺丰、中通等查询时还会校验订单收件手机号。"
              />
            </section>
          </div>
        </a-tab-pane>

        <a-tab-pane key="integrations">
          <template #tab><span><ApiOutlined /> 登录与支付</span></template>
          <div class="settings-content">
            <div class="section-intro">
              <h2>登录与支付</h2>
              <p>仅保留微信小程序登录和微信支付配置。</p>
            </div>
            <section class="setting-section">
              <div class="switch-heading">
                <div>
                  <h3 class="setting-section-title">小程序微信登录</h3>
                  <p>AppID 和 AppSecret 用于微信登录、手机号授权等服务端能力。</p>
                </div>
                <a-switch v-model:checked="form.miniprogram_enabled" checked-children="启用" un-checked-children="停用" />
              </div>
              <div class="form-grid">
                <a-form-item label="小程序 AppID">
                  <a-input v-model:value="form.miniprogram_app_id" name="miniprogram-app-id" autocomplete="off" placeholder="wx 开头的 AppID" />
                </a-form-item>
                <a-form-item label="小程序 AppSecret">
                  <a-input-password v-model:value="form.miniprogram_app_secret" name="miniprogram-app-secret" autocomplete="new-password" placeholder="微信公众平台 AppSecret" />
                </a-form-item>
              </div>
            </section>
            <section class="setting-section">
              <div class="switch-heading">
                <div>
                  <h3 class="setting-section-title">微信支付（小程序）</h3>
                  <p>需要微信支付商户号、API v3 密钥、商户 API 证书和微信支付公钥。</p>
                </div>
                <a-switch v-model:checked="form.wxpay_enabled" checked-children="启用" un-checked-children="停用" />
              </div>
              <div class="form-grid">
                <a-form-item label="支付 AppID">
                  <a-input v-model:value="form.wxpay_app_id" name="wxpay-app-id" autocomplete="off" placeholder="通常与小程序 AppID 相同" />
                </a-form-item>
                <a-form-item label="商户号 MchID">
                  <a-input v-model:value="form.wxpay_mch_id" name="wxpay-mch-id" autocomplete="off" />
                </a-form-item>
                <a-form-item label="API v3 Key">
                  <a-input-password v-model:value="form.wxpay_api_v3_key" name="wxpay-api-v3-key" autocomplete="new-password" />
                </a-form-item>
                <a-form-item label="商户证书序列号">
                  <a-input v-model:value="form.wxpay_mch_serial_no" name="wxpay-cert-serial" autocomplete="off" />
                </a-form-item>
                <a-form-item label="微信支付公钥 ID">
                  <a-input v-model:value="form.wxpay_public_key_id" name="wxpay-public-key-id" autocomplete="off" placeholder="PUB_KEY_ID_ 开头" />
                </a-form-item>
                <a-form-item class="span-2" label="支付回调地址">
                  <a-input v-model:value="form.wxpay_notify_url" placeholder="https://域名/api/pay/notify_wxpay" />
                </a-form-item>
                <a-form-item class="span-2" label="退款回调地址">
                  <a-input v-model:value="form.wxpay_refund_notify_url" placeholder="https://域名/api/pay/notify_wxpay_refund" />
                  <div class="field-help">微信退款结果通知地址；留空时后端会根据支付回调地址自动生成。</div>
                </a-form-item>
                <a-form-item class="span-2" label="商户 API 私钥">
                  <a-textarea v-model:value="form.wxpay_private_key" name="wxpay-private-key" autocomplete="off" :rows="6" class="secret-area" />
                </a-form-item>
                <a-form-item class="span-2" label="微信支付公钥">
                  <a-textarea v-model:value="form.wxpay_public_key" name="wxpay-public-key" autocomplete="off" :rows="5" class="secret-area" placeholder="-----BEGIN PUBLIC KEY-----" />
                  <div class="field-help">在微信支付商户平台“账户中心 → API安全 → 微信支付公钥”下载。</div>
                </a-form-item>
              </div>
            </section>
            <!-- 暂时隐藏积分规则，后续需要时取消本段注释即可恢复。
            <section class="setting-section">
              <h3 class="setting-section-title">积分规则</h3>
              <a-form-item label="积分规则说明">
                <a-textarea v-model:value="form.points_rule_text" :rows="4" />
              </a-form-item>
            </section>
            -->
          </div>
        </a-tab-pane>
      </a-tabs>
    </a-card>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import {
  ApiOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  CheckOutlined,
  CustomerServiceOutlined,
  DeleteOutlined,
  MobileOutlined,
  PictureOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  UploadOutlined,
} from '@ant-design/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import ImageUploader from '@/components/ImageUploader.vue'
import AudioUploader from '@/components/AudioUploader.vue'
import { errorMessage, get, post, uploadImage } from '@/api/http'
import { isThemeKey, themeImagePresets, type ThemeKey } from '@/data/themeImagePresets'
import { resolveMedia } from '@/utils/format'

interface EditableHomeSlide {
  rowKey: string
  id: string
  image: string
  eyebrow: string
  title: string
  description: string
  enabled: boolean
}

interface EditableImageSlot {
  key: string
  label: string
  image: string
  help?: string
}

interface EditableTrayImage {
  rowKey: string
  id: string
  image: string
}

interface EditablePurchaseNoticeImage {
  rowKey: string
  id: string
  image: string
}

interface EditableContactQr {
  rowKey: string
  id: string
  image: string
}

interface EditableActivityRewardTier {
  rowKey: string
  likes: number | null
  views: number | null
  reward: number | null
}

interface EditableActivityRequirement {
  rowKey: string
  title: string
  description: string
}

interface StorageStatus {
  provider: 'oss' | 'local'
  oss: {
    configured: boolean
    partiallyConfigured: boolean
    missing: string[]
    region: string
    bucket: string
    publicUrl: string
    internal: boolean
  }
}

interface ThemeOption {
  value: ThemeKey
  label: string
  description: string
  colors: string[]
}

const tab = ref('store')
const loading = ref(false)
const saving = ref(false)
const themePresetDirty = ref(false)
const uploadingSlideKey = ref('')
const uploadingTrayKey = ref('')
const uploadingPurchaseNoticeKey = ref('')
const storageStatus = ref<StorageStatus | null>(null)
const form = reactive<any>({})
const themeOptions: ThemeOption[] = [
  { value: 'healing-ins', label: '治愈 INS 风', description: '暖白、鼠尾草绿与低饱和柔光，当前默认风格。', colors: ['#f6f4ef', '#fcfbf7', '#607d76', '#b77c72', '#414b48'] },
  { value: 'oriental-song', label: '东方宋韵风', description: '宣纸、青瓷、墨灰与克制朱砂，安静雅致。', colors: ['#f3f0e8', '#fbf9f2', '#52685e', '#a65f52', '#303932'] },
  { value: 'glacier-crystal', label: '冰川水晶风', description: '冰川白、浅蓝与清透银灰，轻盈冷静。', colors: ['#f2f7f9', '#fbfdfe', '#52798a', '#927f9e', '#263c46'] },
  { value: 'cream-french', label: '奶油法式风', description: '奶油白、香槟灰粉与柔和旧金，温柔精致。', colors: ['#f7f1e8', '#fffaf3', '#9a7d6c', '#c68f8b', '#51453f'] },
  { value: 'forest-mineral', label: '森系矿石风', description: '苔绿、木色与矿物铁锈色，自然沉静。', colors: ['#eef1ea', '#f8f7f0', '#4e6b58', '#aa7762', '#2f3b33'] },
  { value: 'midnight-astrolabe', label: '暗夜星盘风', description: '午夜蓝、月光银蓝与旧金，深邃但不霓虹。', colors: ['#0e1422', '#151d2c', '#8fa8c7', '#c7a66b', '#f2eadb'] },
  { value: 'japanese-wabi-sabi', label: '日系侘寂风', description: '砂岩、亚麻与苔灰绿，保留自然留下的不完美。', colors: ['#e9e2d7', '#f7f2e9', '#746f60', '#9ca18a', '#b68472'] },
  { value: 'aegean-sea-salt', label: '海盐地中海风', description: '海盐白、爱琴海蓝与赤陶橙，清爽明亮。', colors: ['#eef3f1', '#fcfbf6', '#3d7488', '#7fb6ae', '#c57e64'] },
  { value: 'desert-terracotta', label: '沙丘赤陶风', description: '沙丘米、赤陶棕与鼠尾草绿，温暖而自由。', colors: ['#f3e8d9', '#fcf6ec', '#a35f45', '#8fa18a', '#c9785b'] },
  { value: 'moonlit-pearl', label: '月光珍珠风', description: '珍珠白、雾紫与贝母粉，柔和通透。', colors: ['#f2f0f3', '#fcfafc', '#7d748b', '#a7c6c0', '#c5a5b5'] },
  { value: 'morandi-gallery', label: '莫兰迪画廊风', description: '灰蓝、灰粉与鼠尾草绿，像安静的艺术展陈。', colors: ['#ecebe7', '#f8f7f3', '#6f7784', '#94aaa0', '#b88380'] },
  { value: 'monochrome-museum', label: '黑白博物馆风', description: '象牙白、石墨灰与低彩材质色，克制现代。', colors: ['#ececea', '#fafaf7', '#4f5759', '#9aa6a3', '#9b7b72'] },
]
const contact = reactive({ wechatId: '' })
const contactQrs = ref<EditableContactQr[]>([])
const slides = ref<EditableHomeSlide[]>([])
const trayImages = ref<EditableTrayImage[]>([])
const purchaseNoticeImages = ref<EditablePurchaseNoticeImage[]>([])
const activityRewardTiers = ref<EditableActivityRewardTier[]>([])
const activityRequirements = ref<EditableActivityRequirement[]>([])
const refundReasons = ref<string[]>([])
const mainEntrySlots = ref<EditableImageSlot[]>([
  { key: 'handcraft', label: '开始手作', image: '', help: '建议上传 1200 × 1024 的 JPG。' },
  { key: 'finished-style', label: '制作同款', image: '', help: '建议上传 1200 × 1024 的 JPG。' },
])
const shortcutSlots = ref<EditableImageSlot[]>([
  { key: 'inspiration-atlas', label: '灵感图鉴', image: '' },
  { key: 'cart', label: '购物车', image: '' },
  { key: 'orders', label: '我的订单', image: '' },
  { key: 'my-designs', label: '我的设计', image: '' },
])
let slideSequence = 0
let trayImageSequence = 0
let purchaseNoticeImageSequence = 0
let contactQrSequence = 0
let activityRewardTierSequence = 0
let activityRequirementSequence = 0

const defaultActivityRewardTiers = [
  { likes: 30, views: 1000, reward: 10 },
  { likes: 100, views: 10000, reward: 80 },
  { likes: 1000, views: 100000, reward: 1000 },
  { likes: 10000, views: 1000000, reward: 10000 },
]

const defaultActivityRequirements = [
  { title: '完整记录创作过程', description: '在 DIY 设计页录制 12～25 秒视频，或整理为图文。建议剪去等待片段，保留选珠、调整和成串的关键过程；画面清晰、款式完整，并露出小程序品牌标记。' },
  { title: '零粉也可以参与', description: '活动不设粉丝门槛。小红书、抖音或视频号均可发布，以平台可核验的公开数据为准。' },
  { title: '添加活动相关标签', description: '发布时至少带 3 个相关标签，方便客服核验活动作品。' },
]

const slideColumns = [
  { title: '主图', key: 'image', width: 310 },
  { title: '短标签', key: 'eyebrow', width: 190 },
  { title: '标题', key: 'title', width: 190 },
  { title: '说明', key: 'description', width: 240 },
  { title: '状态', key: 'enabled', width: 90 },
  { title: '操作', key: 'actions', width: 150, fixed: 'right' },
]

const trayColumns = [
  { title: '顺序与用途', key: 'order', width: 150 },
  { title: '珠盘图片', key: 'image' },
  { title: '操作', key: 'actions', width: 150 },
]

const purchaseNoticeColumns = [
  { title: '顺序', key: 'order', width: 100 },
  { title: '购买须知图片', key: 'image' },
  { title: '操作', key: 'actions', width: 150 },
]

const stringKeys = [
  'points_rule_text',
  'refund_return_address',
  'kuaidi100_key',
  'kuaidi100_customer',
  'miniprogram_app_id',
  'miniprogram_app_secret',
  'miniprogram_name',
  'miniprogram_home_identity_name',
  'miniprogram_diy_page_title',
  'miniprogram_theme_key',
  'miniprogram_launch_background_image',
  'site_title_logo_image',
  'miniprogram_wrist_measurement_image',
  'miniprogram_home_process_image',
  'miniprogram_home_activity_image',
  'miniprogram_customer_service_float_image',
  'miniprogram_home_music_url',
  'miniprogram_mall_hero_image',
  'miniprogram_diy_showcase_eyebrow',
  'miniprogram_diy_showcase_title',
  'miniprogram_diy_showcase_description',
  'wxpay_app_id',
  'wxpay_mch_id',
  'wxpay_api_v3_key',
  'wxpay_mch_serial_no',
  'wxpay_private_key',
  'wxpay_public_key_id',
  'wxpay_public_key',
  'wxpay_notify_url',
  'wxpay_refund_notify_url',
]
const boolKeys = ['miniprogram_enabled', 'wxpay_enabled', 'kuaidi100_enabled']

const storageAlertType = computed(() => {
  if (!storageStatus.value) return 'info'
  if (storageStatus.value.oss.configured) return 'success'
  return storageStatus.value.oss.partiallyConfigured ? 'error' : 'info'
})

const storageAlertMessage = computed(() => {
  if (!storageStatus.value) return '正在检查图片存储配置'
  if (storageStatus.value.oss.configured) return '阿里云 OSS 配置完整'
  if (storageStatus.value.oss.partiallyConfigured) return '阿里云 OSS 配置不完整'
  return '图片上传使用本地开发存储'
})

const storageAlertDescription = computed(() => {
  const status = storageStatus.value
  if (!status) return '请稍候'
  if (status.oss.configured) return `图片上传将使用阿里云 OSS；实际权限会在上传时校验。地域：${status.oss.region}；空间：${status.oss.bucket}；访问域名：${status.oss.publicUrl}${status.oss.internal ? '；服务端上传走同地域内网' : ''}`
  if (status.oss.partiallyConfigured) return `缺少：${status.oss.missing.join('、')}`
  return '未配置阿里云 OSS 时才保存到本地；正式环境建议配置 OSS。'
})

function text(value: unknown): string {
  return String(value ?? '').trim()
}

function normalizeSlideImage(value: unknown): string {
  return text(value).replace(/^["']+|["']+$/g, '')
}

function boolValue(value: unknown): boolean {
  return value === true || value === 1 || value === '1' || value === 'true'
}

function positiveIntegerOrNull(value: unknown): number | null {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function createActivityRewardTier(source: any = {}): EditableActivityRewardTier {
  activityRewardTierSequence += 1
  return {
    rowKey: `activity-reward-tier-${activityRewardTierSequence}`,
    likes: positiveIntegerOrNull(source.likes),
    views: positiveIntegerOrNull(source.views),
    reward: positiveIntegerOrNull(source.reward),
  }
}

function parseActivityRewardTiers(value: unknown): EditableActivityRewardTier[] {
  try {
    const parsed = JSON.parse(text(value) || '[]')
    const source = Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultActivityRewardTiers
    return source.slice(0, 10).map(createActivityRewardTier)
  } catch {
    message.error('数据库中的灵感分享奖励阶梯格式错误，已显示默认内容')
    return defaultActivityRewardTiers.map(createActivityRewardTier)
  }
}

function serializeActivityRewardTiers(): string {
  return JSON.stringify(activityRewardTiers.value.map((item) => ({
    likes: Number(item.likes),
    views: Number(item.views),
    reward: Number(item.reward),
  })))
}

function createActivityRequirement(source: any = {}): EditableActivityRequirement {
  activityRequirementSequence += 1
  return {
    rowKey: `activity-requirement-${activityRequirementSequence}`,
    title: text(source.title),
    description: text(source.description || source.desc),
  }
}

function parseActivityRequirements(value: unknown): EditableActivityRequirement[] {
  try {
    const parsed = JSON.parse(text(value) || '[]')
    const source = Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultActivityRequirements
    return source.slice(0, 10).map(createActivityRequirement)
  } catch {
    message.error('数据库中的灵感分享发布要求格式错误，已显示默认内容')
    return defaultActivityRequirements.map(createActivityRequirement)
  }
}

function serializeActivityRequirements(): string {
  return JSON.stringify(activityRequirements.value.map((item) => ({
    title: text(item.title),
    description: text(item.description),
  })))
}

function createSlide(source: any = {}): EditableHomeSlide {
  slideSequence += 1
  const id = text(source.id) || `home-slide-${Date.now()}-${slideSequence}`
  return {
    rowKey: `slide-editor-${slideSequence}`,
    id,
    image: normalizeSlideImage(source.image || source.imageUrl || source.image_url || source.url),
    eyebrow: text(source.eyebrow || source.tagline || source.label),
    title: text(source.title),
    description: text(source.description || source.subtitle || source.desc),
    enabled: source.enabled === undefined ? true : boolValue(source.enabled),
  }
}

function parseSlides(value: unknown): EditableHomeSlide[] {
  try {
    const parsed = JSON.parse(text(value) || '[]')
    return Array.isArray(parsed) ? parsed.map(createSlide) : []
  } catch {
    message.error('数据库中的首页轮播配置格式错误，请重新配置')
    return []
  }
}

function serializeSlides(): string {
  if (!slides.value.length) return ''
  return JSON.stringify(slides.value.map((slide) => ({
    id: slide.id,
    image: normalizeSlideImage(slide.image),
    eyebrow: text(slide.eyebrow),
    title: text(slide.title),
    description: text(slide.description),
    enabled: slide.enabled,
  })))
}

function createTrayImage(source: any = {}): EditableTrayImage {
  trayImageSequence += 1
  return {
    rowKey: `tray-image-editor-${trayImageSequence}`,
    id: text(source.id) || `diy-tray-${Date.now()}-${trayImageSequence}`,
    image: normalizeSlideImage(
      typeof source === 'string'
        ? source
        : source.image || source.imageUrl || source.image_url || source.url,
    ),
  }
}

function parseTrayImages(value: unknown): EditableTrayImage[] {
  try {
    const parsed = JSON.parse(text(value) || '[]')
    return Array.isArray(parsed) ? parsed.map(createTrayImage).slice(0, 5) : []
  } catch {
    message.error('数据库中的 DIY 珠盘图片配置格式错误，请重新配置')
    return []
  }
}

function serializeTrayImages(): string {
  if (!trayImages.value.length) return ''
  return JSON.stringify(trayImages.value.map((item) => ({
    id: item.id,
    image: normalizeSlideImage(item.image),
  })))
}

function createPurchaseNoticeImage(source: any = {}): EditablePurchaseNoticeImage {
  purchaseNoticeImageSequence += 1
  return {
    rowKey: `purchase-notice-editor-${purchaseNoticeImageSequence}`,
    id: text(source.id) || `purchase-notice-${Date.now()}-${purchaseNoticeImageSequence}`,
    image: normalizeSlideImage(
      typeof source === 'string'
        ? source
        : source.image || source.imageUrl || source.image_url || source.url,
    ),
  }
}

function parsePurchaseNoticeImages(value: unknown): EditablePurchaseNoticeImage[] {
  try {
    const parsed = JSON.parse(text(value) || '[]')
    return Array.isArray(parsed) ? parsed.map(createPurchaseNoticeImage).slice(0, 10) : []
  } catch {
    message.error('数据库中的购买须知图片配置格式错误，请重新配置')
    return []
  }
}

function serializePurchaseNoticeImages(): string {
  if (!purchaseNoticeImages.value.length) return ''
  return JSON.stringify(purchaseNoticeImages.value.map((item) => ({
    id: item.id,
    image: normalizeSlideImage(item.image),
  })))
}

function createContactQr(source: any = {}): EditableContactQr {
  contactQrSequence += 1
  const rawImage = typeof source === 'string'
    ? source
    : source.image || source.imageUrl || source.image_url || source.url || source.wechatQr
  return {
    rowKey: `contact-qr-editor-${contactQrSequence}`,
    id: text(source?.id) || `contact-qr-${Date.now()}-${contactQrSequence}`,
    image: normalizeSlideImage(rawImage),
  }
}

function hydrateContact(value: unknown): void {
  let source: Record<string, any> = {}
  try {
    const parsed = JSON.parse(text(value) || '{}')
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) source = parsed
  } catch {
    message.error('数据库中的客服配置格式错误，请重新配置')
  }
  contact.wechatId = text(source.wechatId)
  const configuredList = Array.isArray(source.wechatQrs)
    ? source.wechatQrs
    : Array.isArray(source.wechatQrUrls)
      ? source.wechatQrUrls
      : []
  const configured = configuredList.length > 0
    ? configuredList
    : source.wechatQr ? [source.wechatQr] : []
  contactQrs.value = configured.map(createContactQr).filter((item) => item.image).slice(0, 10)
}

function serializeContact(): string {
  const items = contactQrs.value.map((item) => ({
    id: item.id,
    image: normalizeSlideImage(item.image),
  }))
  return JSON.stringify({
    wechatId: text(contact.wechatId),
    wechatQr: items[0]?.image || '',
    wechatQrs: items,
  })
}

function hydrateImageSlots(slots: EditableImageSlot[], value: unknown): void {
  try {
    const parsed = JSON.parse(text(value) || '[]')
    if (!Array.isArray(parsed)) return
    for (const slot of slots) {
      const source = parsed.find((item) => {
        if (!item || typeof item !== 'object') return false
        const record = item as Record<string, unknown>
        return text(record.key || record.id) === slot.key
      }) as Record<string, unknown> | undefined
      slot.image = source ? normalizeSlideImage(source.image || source.imageUrl || source.image_url || source.url) : ''
    }
  } catch {
    message.error('数据库中的首页图片配置格式错误，请重新配置')
  }
}

function serializeImageSlots(slots: EditableImageSlot[]): string {
  return JSON.stringify(slots.map((slot) => ({
    key: slot.key,
    image: normalizeSlideImage(slot.image),
  })))
}

function handleThemeChange(value: unknown): void {
  if (!isThemeKey(value)) return

  const preset = themeImagePresets[value]
  form.miniprogram_theme_key = value
  form.site_title_logo_image = preset.siteTitleLogoImage
  form.miniprogram_launch_background_image = preset.launchBackgroundImage
  form.miniprogram_wrist_measurement_image = preset.wristMeasurementImage
  form.miniprogram_customer_service_float_image = preset.customerServiceFloatImage
  form.miniprogram_home_process_image = preset.homeProcessImage
  form.miniprogram_home_activity_image = preset.homeActivityImage
  form.miniprogram_mall_hero_image = preset.mallHeroImage
  form.miniprogram_diy_showcase_eyebrow = preset.diyShowcaseCopy.eyebrow
  form.miniprogram_diy_showcase_title = preset.diyShowcaseCopy.title
  form.miniprogram_diy_showcase_description = preset.diyShowcaseCopy.description

  const previousSlides = slides.value
  slides.value = preset.slides.map((image, index) => {
    const previous = previousSlides[index]
    const copy = preset.slideCopy[index]
    const content = {
      image,
      eyebrow: copy?.eyebrow || '',
      title: copy?.title || '',
      description: copy?.description || '',
    }
    return previous ? { ...previous, ...content } : createSlide({ ...content, enabled: true })
  })

  for (const slot of mainEntrySlots.value) {
    if (slot.key === 'handcraft' || slot.key === 'finished-style') {
      slot.image = preset.mainEntries[slot.key]
    }
  }
  for (const slot of shortcutSlots.value) {
    if (slot.key === 'inspiration-atlas' || slot.key === 'cart' || slot.key === 'orders' || slot.key === 'my-designs') {
      slot.image = preset.shortcuts[slot.key]
    }
  }

  themePresetDirty.value = true
  const label = themeOptions.find((option) => option.value === value)?.label || value
  message.info(`已切换为“${label}”完整预设，点击“保存全部设置”后才会生效`)
}

async function load() {
  loading.value = true
  try {
    const data: any = await get('/api/admin/settings_get')
    Object.assign(form, data)
    for (const key of stringKeys) form[key] = String(data[key] ?? '')
    if (!themeOptions.some((option) => option.value === form.miniprogram_theme_key)) {
      form.miniprogram_theme_key = 'healing-ins'
    }
    for (const key of boolKeys) form[key] = boolValue(data[key])
    form.kuaidi100_cache_minutes = Number(data.kuaidi100_cache_minutes || 30)
    slides.value = parseSlides(data.miniprogram_home_slides_json)
    trayImages.value = parseTrayImages(data.miniprogram_diy_tray_images_json)
    purchaseNoticeImages.value = parsePurchaseNoticeImages(data.miniprogram_purchase_notice_images_json)
    activityRewardTiers.value = parseActivityRewardTiers(data.miniprogram_activity_reward_tiers_json)
    activityRequirements.value = parseActivityRequirements(data.miniprogram_activity_requirements_json)
    try {
      const parsed = JSON.parse(String(data.miniprogram_refund_reasons_json || '[]'))
      refundReasons.value = Array.isArray(parsed) ? parsed.map((item) => text(item)).filter(Boolean).slice(0, 10) : []
    } catch {
      refundReasons.value = []
    }
    if (refundReasons.value.length === 0) refundReasons.value = ['质量问题', '商品与描述不符', '其他问题']
    hydrateImageSlots(mainEntrySlots.value, data.miniprogram_home_main_entries_json)
    hydrateImageSlots(shortcutSlots.value, data.miniprogram_home_shortcuts_json)
    hydrateContact(data.contact_service_json)
    themePresetDirty.value = false
  } catch (error) {
    message.error(errorMessage(error))
  } finally {
    loading.value = false
  }
}

async function loadStorageStatus() {
  try {
    storageStatus.value = await get<StorageStatus>('/api/admin/storage_status')
  } catch (error) {
    message.error(errorMessage(error))
  }
}

function addSlide() {
  if (slides.value.length >= 5) return message.warning('首页轮播最多配置 5 张')
  slides.value.push(createSlide())
}

function moveSlide(index: number, offset: number) {
  const target = index + offset
  if (target < 0 || target >= slides.value.length) return
  const [slide] = slides.value.splice(index, 1)
  if (slide) slides.value.splice(target, 0, slide)
}

function removeSlide(rowKey: string) {
  slides.value = slides.value.filter((slide) => slide.rowKey !== rowKey)
}

function addTrayImage() {
  if (trayImages.value.length >= 5) return message.warning('DIY 珠盘最多配置 5 张')
  trayImages.value.push(createTrayImage())
}

function moveTrayImage(index: number, offset: number) {
  const target = index + offset
  if (target < 0 || target >= trayImages.value.length) return
  const [item] = trayImages.value.splice(index, 1)
  if (item) trayImages.value.splice(target, 0, item)
}

function removeTrayImage(rowKey: string) {
  trayImages.value = trayImages.value.filter((item) => item.rowKey !== rowKey)
}

function addPurchaseNoticeImage() {
  if (purchaseNoticeImages.value.length >= 10) return message.warning('购买须知最多配置 10 张')
  purchaseNoticeImages.value.push(createPurchaseNoticeImage())
}

function movePurchaseNoticeImage(index: number, offset: number) {
  const target = index + offset
  if (target < 0 || target >= purchaseNoticeImages.value.length) return
  const [item] = purchaseNoticeImages.value.splice(index, 1)
  if (item) purchaseNoticeImages.value.splice(target, 0, item)
}

function removePurchaseNoticeImage(rowKey: string) {
  purchaseNoticeImages.value = purchaseNoticeImages.value.filter((item) => item.rowKey !== rowKey)
}

function addContactQr() {
  if (contactQrs.value.length >= 10) return message.warning('客服二维码最多配置 10 个')
  contactQrs.value.push(createContactQr())
}

function removeContactQr(rowKey: string) {
  contactQrs.value = contactQrs.value.filter((item) => item.rowKey !== rowKey)
}

function addActivityRewardTier() {
  if (activityRewardTiers.value.length >= 10) return message.warning('奖励阶梯最多配置 10 档')
  activityRewardTiers.value.push(createActivityRewardTier())
}

function moveActivityRewardTier(index: number, offset: number) {
  const target = index + offset
  if (target < 0 || target >= activityRewardTiers.value.length) return
  const [item] = activityRewardTiers.value.splice(index, 1)
  if (item) activityRewardTiers.value.splice(target, 0, item)
}

function removeActivityRewardTier(index: number) {
  if (activityRewardTiers.value.length <= 1) return message.warning('至少保留一档奖励')
  activityRewardTiers.value.splice(index, 1)
}

function addActivityRequirement() {
  if (activityRequirements.value.length >= 10) return message.warning('发布要求最多配置 10 项')
  activityRequirements.value.push(createActivityRequirement())
}

function moveActivityRequirement(index: number, offset: number) {
  const target = index + offset
  if (target < 0 || target >= activityRequirements.value.length) return
  const [item] = activityRequirements.value.splice(index, 1)
  if (item) activityRequirements.value.splice(target, 0, item)
}

function removeActivityRequirement(index: number) {
  if (activityRequirements.value.length <= 1) return message.warning('至少保留一项发布要求')
  activityRequirements.value.splice(index, 1)
}

function addRefundReason() {
  if (refundReasons.value.length >= 10) return message.warning('售后原因最多配置 10 项')
  refundReasons.value.push('')
}

function moveRefundReason(index: number, offset: number) {
  const target = index + offset
  if (target < 0 || target >= refundReasons.value.length) return
  const [reason] = refundReasons.value.splice(index, 1)
  if (reason !== undefined) refundReasons.value.splice(target, 0, reason)
}

function removeRefundReason(index: number) {
  if (refundReasons.value.length <= 1) return message.warning('至少保留一条售后原因')
  refundReasons.value.splice(index, 1)
}

function validateSlideFile(file: File) {
  if (file.size > 5 * 1024 * 1024) {
    message.error('图片大小不能超过 5 MB')
    return false
  }
  if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
    message.error('仅支持 JPG、PNG、GIF、WebP 图片')
    return false
  }
  return true
}

async function uploadSlide(options: any, slide: EditableHomeSlide) {
  uploadingSlideKey.value = slide.rowKey
  try {
    const result = await uploadImage(options.file as File)
    slide.image = result.url
    options.onSuccess?.(result)
    message.success(result.source === 'oss' ? '轮播图片已上传到阿里云 OSS，请继续填写内容' : '轮播图片已上传到本地，请继续填写内容')
  } catch (error) {
    message.error(errorMessage(error))
    options.onError?.(error as Error)
  } finally {
    uploadingSlideKey.value = ''
  }
}

async function uploadTrayImage(options: any, trayImage: EditableTrayImage) {
  uploadingTrayKey.value = trayImage.rowKey
  try {
    const result = await uploadImage(options.file as File)
    trayImage.image = result.url
    options.onSuccess?.(result)
    message.success(result.source === 'oss' ? '珠盘图片已上传到阿里云 OSS' : '珠盘图片已上传到本地')
  } catch (error) {
    message.error(errorMessage(error))
    options.onError?.(error as Error)
  } finally {
    uploadingTrayKey.value = ''
  }
}

async function uploadPurchaseNoticeImage(options: any, item: EditablePurchaseNoticeImage) {
  uploadingPurchaseNoticeKey.value = item.rowKey
  try {
    const result = await uploadImage(options.file as File)
    item.image = result.url
    options.onSuccess?.(result)
    message.success(result.source === 'oss' ? '购买须知图片已上传到阿里云 OSS' : '购买须知图片已上传到本地')
  } catch (error) {
    message.error(errorMessage(error))
    options.onError?.(error as Error)
  } finally {
    uploadingPurchaseNoticeKey.value = ''
  }
}

async function save() {
  const homeIdentityName = text(form.miniprogram_home_identity_name)
  const diyPageTitle = text(form.miniprogram_diy_page_title)
  if (!homeIdentityName) return message.warning('请填写首页默认用户名称')
  if (!diyPageTitle) return message.warning('请填写 DIY 页面标题')
  if (homeIdentityName.length > 12 || diyPageTitle.length > 12) {
    return message.warning('页面显示文案不能超过 12 个字符')
  }
  if (!themeOptions.some((option) => option.value === form.miniprogram_theme_key)) {
    return message.warning('请选择有效的小程序页面风格')
  }
  for (const slide of slides.value) slide.image = normalizeSlideImage(slide.image)
  if (slides.value.some((slide) => !slide.image)) {
    return message.warning('每条轮播都必须填写图片地址或上传图片')
  }
  if (slides.value.length > 5) return message.warning('首页轮播最多配置 5 张')
  for (const trayImage of trayImages.value) trayImage.image = normalizeSlideImage(trayImage.image)
  if (trayImages.value.some((trayImage) => !trayImage.image)) {
    return message.warning('每个 DIY 珠盘都必须填写图片地址或上传图片')
  }
  if (trayImages.value.length > 5) return message.warning('DIY 珠盘最多配置 5 张')
  for (const item of purchaseNoticeImages.value) item.image = normalizeSlideImage(item.image)
  if (purchaseNoticeImages.value.some((item) => !item.image)) {
    return message.warning('每张购买须知都必须填写图片地址或上传图片')
  }
  if (purchaseNoticeImages.value.length > 10) return message.warning('购买须知最多配置 10 张')
  for (const item of contactQrs.value) item.image = normalizeSlideImage(item.image)
  if (contactQrs.value.some((item) => !item.image)) {
    return message.warning('请上传客服二维码，或删除未填写的二维码项')
  }
  if (contactQrs.value.length > 10) return message.warning('客服二维码最多配置 10 个')
  if (activityRewardTiers.value.length < 1 || activityRewardTiers.value.length > 10) {
    return message.warning('奖励阶梯需要配置 1 至 10 档')
  }
  for (let index = 0; index < activityRewardTiers.value.length; index += 1) {
    const item = activityRewardTiers.value[index]
    if (!item || !Number.isInteger(item.likes) || !Number.isInteger(item.views) || !Number.isInteger(item.reward)
      || Number(item.likes) <= 0 || Number(item.views) <= 0 || Number(item.reward) <= 0) {
      return message.warning(`奖励阶梯第 ${index + 1} 档的三个数字都必须是正整数`)
    }
    const previous = activityRewardTiers.value[index - 1]
    if (previous && (Number(item.likes) <= Number(previous.likes) || Number(item.views) <= Number(previous.views))) {
      return message.warning(`奖励阶梯第 ${index + 1} 档的点赞数和播放量必须高于上一档`)
    }
    if (previous && Number(item.reward) < Number(previous.reward)) {
      return message.warning(`奖励阶梯第 ${index + 1} 档的奖励不能低于上一档`)
    }
  }
  if (activityRequirements.value.length < 1 || activityRequirements.value.length > 10) {
    return message.warning('发布要求需要配置 1 至 10 项')
  }
  for (let index = 0; index < activityRequirements.value.length; index += 1) {
    const item = activityRequirements.value[index]
    const title = text(item?.title)
    const description = text(item?.description)
    if (!title || !description) return message.warning(`发布要求第 ${index + 1} 项的标题和说明不能为空`)
    if (title.length > 30) return message.warning(`发布要求第 ${index + 1} 项的标题不能超过 30 个字符`)
    if (description.length > 300) return message.warning(`发布要求第 ${index + 1} 项的说明不能超过 300 个字符`)
  }
  const normalizedRefundReasons = refundReasons.value.map((reason) => text(reason))
  if (normalizedRefundReasons.some((reason) => !reason)) return message.warning('售后原因不能为空')
  if (normalizedRefundReasons.some((reason) => reason.length > 20)) return message.warning('每条售后原因不能超过 20 个字符')
  if (new Set(normalizedRefundReasons).size !== normalizedRefundReasons.length) return message.warning('售后原因不能重复')
  const homeMusicUrl = text(form.miniprogram_home_music_url)
  if (homeMusicUrl && !/^https:\/\//i.test(homeMusicUrl)) {
    return message.warning('首页背景音乐必须使用 HTTPS 地址')
  }
  const kuaidi100CacheMinutes = Number(form.kuaidi100_cache_minutes)
  if (!Number.isInteger(kuaidi100CacheMinutes) || kuaidi100CacheMinutes < 30 || kuaidi100CacheMinutes > 1440) {
    return message.warning('快递100查询缓存时间必须是 30 至 1440 分钟的整数')
  }
  const payload: Record<string, unknown> = {
    contact_service_json: serializeContact(),
    miniprogram_home_slides_json: serializeSlides(),
    miniprogram_home_main_entries_json: serializeImageSlots(mainEntrySlots.value),
    miniprogram_home_shortcuts_json: serializeImageSlots(shortcutSlots.value),
    miniprogram_diy_tray_images_json: serializeTrayImages(),
    miniprogram_purchase_notice_images_json: serializePurchaseNoticeImages(),
    miniprogram_activity_reward_tiers_json: serializeActivityRewardTiers(),
    miniprogram_activity_requirements_json: serializeActivityRequirements(),
    miniprogram_refund_reasons_json: JSON.stringify(normalizedRefundReasons),
    kuaidi100_cache_minutes: kuaidi100CacheMinutes,
  }
  for (const key of stringKeys) payload[key] = String(form[key] ?? '').trim()
  for (const key of boolKeys) payload[key] = Boolean(form[key])

  saving.value = true
  try {
    await post('/api/admin/settings_update', payload)
    message.success('小程序设置已保存；首页下拉刷新或重新进入小程序后可见')
    await load()
  } catch (error) {
    message.error(errorMessage(error))
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  void load()
  void loadStorageStatus()
})
</script>

<style scoped>
.settings-card :deep(.ant-card-body) { padding: 0; }
.settings-tabs { min-height: 700px; }
.settings-tabs :deep(.ant-tabs-nav) { width: 180px; margin: 0; padding: 20px 12px; border-right: 1px solid #edf1ef; }
.settings-tabs :deep(.ant-tabs-tab) { padding: 12px 14px !important; border-radius: 9px; }
.settings-tabs :deep(.ant-tabs-tab-active) { background: #edf5f1; }
.settings-tabs :deep(.ant-tabs-content-holder) { min-width: 0; padding: 28px; }
.settings-content { display: flex; max-width: 900px; flex-direction: column; gap: 18px; }
.settings-content--wide { max-width: 1180px; }
.section-intro { margin-bottom: 2px; }
.section-intro h2 { margin: 0; color: #23473c; font: 700 24px Georgia, 'Noto Serif SC', serif; }
.section-intro p,
.switch-heading p,
.section-toolbar p { margin: 5px 0 0; color: #8b9893; font-size: 12px; }
.switch-heading,
.section-toolbar { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 18px; }
.switch-heading .setting-section-title,
.section-toolbar .setting-section-title { margin-bottom: 0; }
.field-help { margin-top: 10px; color: #96a29d; font-size: 11px; }
.asset-grid { display: grid; gap: 18px 24px; }
.asset-grid--two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.asset-grid :deep(.ant-form-item) { min-width: 0; margin-bottom: 0; }
.form-grid__wide { grid-column: 1 / -1; }
.theme-switcher {
  padding: 20px;
  border: 1px solid #e1e9e5;
  border-radius: 14px;
  background: #f7faf8;
}
.theme-switcher__heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 16px;
}
.theme-switcher__heading > div > span {
  display: block;
  margin-bottom: 4px;
  color: #879991;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .15em;
}
.theme-switcher__heading h3 { margin: 0; color: #244a3e; font: 700 20px Georgia, 'Noto Serif SC', serif; }
.theme-switcher__heading p { margin: 5px 0 0; color: #7f8d88; font-size: 12px; }
.theme-switcher__status {
  flex: 0 0 auto;
  padding: 4px 9px;
  border-radius: 999px;
  color: #5d776e;
  background: #e8f0ec;
  font-size: 11px;
  font-weight: 600;
}
.theme-switcher__status.is-dirty { color: #9a6b2f; background: #f7ead4; }
.theme-choice-row {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 8px;
  padding: 1px;
}
.theme-choice {
  position: relative;
  display: flex;
  min-width: 0;
  min-height: 118px;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  border: 1px solid #e0e7e3;
  border-radius: 11px;
  color: #374640;
  background: #fff;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 140ms ease, box-shadow 140ms ease, transform 140ms ease, background-color 140ms ease;
}
.theme-choice__swatches {
  display: grid;
  height: 22px;
  overflow: hidden;
  border: 1px solid rgba(31, 45, 40, .1);
  border-radius: 7px;
  grid-template-columns: repeat(5, minmax(0, 1fr));
}
.theme-choice__swatches i { display: block; }
.theme-choice__title { padding-right: 16px; font-size: 12px; font-weight: 700; line-height: 1.4; }
.theme-choice__selected { position: absolute; top: 39px; right: 8px; display: grid; width: 18px; height: 18px; place-items: center; border-radius: 50%; color: #fff; background: #607d76; font-size: 10px; }
.theme-choice small { display: -webkit-box; overflow: hidden; color: #84908c; font-size: 10px; line-height: 1.5; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.theme-choice.is-selected {
  border-color: #6f8f86;
  background: #fbfdfc;
  box-shadow: 0 0 0 1px rgba(96, 125, 118, .22), 0 8px 20px rgba(66, 87, 79, .08);
}
.theme-choice:focus-visible { outline: 3px solid rgba(96, 125, 118, .2); outline-offset: 2px; }
.theme-choice:active { transform: scale(.985); }
@media (hover: hover) {
  .theme-choice:hover { border-color: #9ab0a8; background: #fcfdfc; }
}
.theme-preset-notice { margin-top: 12px; }
.contact-qr-list { display: flex; max-width: 760px; flex-direction: column; gap: 12px; }
.contact-qr-row { display: grid; grid-template-columns: 30px minmax(0, 1fr) auto; align-items: center; gap: 12px; padding: 12px; border: 1px solid #e5ece8; border-radius: 12px; background: #fafcfb; }
.contact-qr-order { display: grid; width: 30px; height: 30px; place-items: center; border-radius: 9px; color: #557067; background: #eaf2ee; font-size: 12px; font-weight: 700; }
.secret-area { font-family: 'SFMono-Regular', Consolas, monospace; }
.slide-table { overflow: hidden; border: 1px solid #e5ece8; border-radius: 12px; }
.slide-table :deep(.ant-table-thead > tr > th) { color: #49645b; background: #f4f8f6; font-size: 12px; }
.slide-table :deep(.ant-table-cell) { vertical-align: top; }
.slide-image-cell { display: flex; align-items: flex-start; gap: 10px; }
.slide-image-preview { display: grid; width: 96px; height: 64px; overflow: hidden; flex: 0 0 96px; place-items: center; border: 1px dashed #cbd8d2; border-radius: 9px; color: #93a39c; background: #f5f8f7; font-size: 22px; }
.slide-image-preview img { width: 100%; height: 100%; object-fit: cover; }
.slide-image-preview--tray { width: 76px; height: 76px; flex-basis: 76px; border-radius: 50%; }
.slide-image-preview--notice { width: 96px; height: 120px; flex-basis: 96px; }
.slide-image-inputs { display: flex; min-width: 180px; flex: 1; flex-direction: column; align-items: flex-start; gap: 7px; }
.setting-area-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; padding: 20px 4px 2px; border-top: 1px solid #e5ece8; }
.setting-area-heading--first { padding-top: 2px; border-top: 0; }
.setting-area-heading > div { display: flex; align-items: baseline; gap: 12px; }
.setting-area-heading span { color: #8fa299; font-size: 10px; font-weight: 700; letter-spacing: .16em; }
.setting-area-heading h3 { margin: 0; color: #244a3e; font: 700 20px Georgia, 'Noto Serif SC', serif; }
.setting-area-heading p { max-width: 520px; margin: 0; color: #8b9893; font-size: 12px; text-align: right; }
.tray-order-cell { display: flex; min-height: 76px; flex-direction: column; align-items: flex-start; justify-content: center; gap: 8px; }
.tray-order-cell strong { color: #31584b; font-size: 18px; }
.refund-reason-list { display: flex; max-width: 720px; flex-direction: column; gap: 10px; }
.refund-reason-row { display: grid; grid-template-columns: 28px minmax(220px, 1fr) auto; align-items: center; gap: 10px; }
.refund-reason-order { display: grid; width: 28px; height: 28px; place-items: center; border-radius: 8px; color: #577067; background: #edf4f1; font-size: 12px; font-weight: 700; }
.activity-config-block { margin-top: 24px; padding-top: 22px; border-top: 1px solid #e7edea; }
.activity-config-list { display: flex; flex-direction: column; gap: 10px; }
.activity-reward-config-row,
.activity-requirement-config-row { display: grid; align-items: end; gap: 12px; padding: 14px; border: 1px solid #e3ebe7; border-radius: 12px; background: #fafcfb; }
.activity-reward-config-row { grid-template-columns: 36px repeat(3, minmax(130px, 1fr)) auto; }
.activity-requirement-config-row { grid-template-columns: 36px minmax(0, 1fr) auto; align-items: center; }
.activity-config-order { display: grid; width: 36px; height: 36px; align-self: center; place-items: center; border-radius: 10px; color: #557067; background: #eaf2ee; font-size: 11px; font-weight: 700; letter-spacing: .05em; }
.activity-config-list :deep(.ant-form-item) { min-width: 0; margin-bottom: 0; }
.activity-config-list :deep(.ant-input-number) { width: 100%; }
.activity-requirement-fields { display: grid; min-width: 0; grid-template-columns: minmax(180px, .7fr) minmax(280px, 1.5fr); gap: 14px; }
.activity-config-actions { align-self: center; }
@media (max-width: 850px) {
  .asset-grid--two { grid-template-columns: 1fr; }
  .theme-switcher { padding: 16px; }
  .theme-switcher__heading { gap: 14px; }
  .settings-tabs { flex-direction: column; }
  .settings-tabs :deep(.ant-tabs-nav) { width: 100%; margin: 0; padding: 8px; border-right: 0; }
  .settings-tabs :deep(.ant-tabs-nav-list) { overflow: auto; }
  .settings-tabs :deep(.ant-tabs-content-holder) { padding: 18px; }
  .activity-reward-config-row { grid-template-columns: 36px repeat(3, minmax(100px, 1fr)); }
  .activity-requirement-config-row { grid-template-columns: 36px minmax(0, 1fr); }
  .activity-config-actions { grid-column: 2 / -1; justify-self: end; }
  .activity-requirement-fields { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .theme-choice-row { overflow-x: auto; grid-template-columns: repeat(12, 108px); padding-bottom: 5px; scrollbar-width: thin; }
}
</style>
