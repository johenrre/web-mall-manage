<template>
  <a-config-provider :theme="theme" :locale="zhCN">
    <router-view />
  </a-config-provider>
</template>

<script setup lang="ts">
import zhCN from 'ant-design-vue/es/locale/zh_CN'

const theme = {
  token: {
    colorPrimary: '#1f6854',
    colorInfo: '#1f6854',
    colorSuccess: '#3d8f6f',
    colorWarning: '#d39a42',
    colorError: '#c75852',
    colorText: '#20322d',
    colorTextSecondary: '#6f7f79',
    colorBgLayout: '#f3f6f4',
    borderRadius: 10,
    borderRadiusLG: 16,
    fontFamily: "Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif",
  },
  components: {
    Menu: {
      darkItemBg: '#153d34',
      darkItemSelectedBg: 'rgba(255,255,255,.14)',
      darkItemHoverBg: 'rgba(255,255,255,.08)',
      itemBorderRadius: 10,
    },
    Table: {
      headerBg: '#f6f8f7',
      headerColor: '#5d6e68',
      borderColor: '#e8eeeb',
    },
    Card: {
      headerBg: 'transparent',
    },
  },
}
</script>
