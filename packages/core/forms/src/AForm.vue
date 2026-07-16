<script setup lang="ts">

import { ref } from 'vue';
import FormFiledRender from './FormFieldRender.vue'
import { FormFieldSchema } from './types.js';


const formSchema = ref<FormFieldSchema[]>([
    {
        component: 'Input',
        label: '用户名称',
        fieldName: 'username',
    }, {
        component: 'Input',
        label: '用户密码',
        fieldName: 'password',
    }, {
        array: true,
        ArrayField:"value",
        component: 'Input',
        label: '用户邮箱',
        fieldName: 'emails',
    }
])

</script>


<template>
    <FormFiledRender :schema="formSchema" />
</template>