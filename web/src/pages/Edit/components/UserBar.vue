<template>
  <div class="toolbarBlock">
    <div class="toolbarBtn" @click="login">
      <span class="icon iconfont icondaoru"></span>
      <span class="text">{{ $t('toolbar.login') }}</span>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {}
  },
  methods: {
    async login() {
      location.href = '/auth/oidc'
    }
  }
}
</script>

<style lang="scss" scoped></style>
