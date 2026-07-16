<script setup lang="ts">

import { ref } from 'vue';
import FormFiledRender from './FormFieldRender.vue'
import { FormFieldSchema } from './types.js';


const formSchema = ref<FormFieldSchema[]>([
    {
        component: 'Input',
        label: '用户名称',
        fieldName: 'username',
        rules: 'required,min:3',
    }, {
        component: 'Input',
        label: '用户密码',
        fieldName: 'password',
        rules: 'required,min:6',
    }, {
        array: true,
        ArrayField: 'value',
        component: 'Input',
        label: '用户邮箱',
        fieldName: 'emails',
        rules: 'required,email',
        maxItems: 5,
        addButtonText: '+ 添加邮箱',
        removeButtonText: '移除',
    }
])

</script>


<template>
    <FormFiledRender :schema="formSchema" />
</template>