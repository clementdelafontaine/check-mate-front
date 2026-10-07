import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import QuantityField from './QuantityField.vue'

const UNITS = ['-', 'g', 'kg']

function mountField(modelValue = '') {
  return mount(QuantityField, { props: { modelValue, units: UNITS } })
}

describe('QuantityField', () => {
  it('displays the current quantity', () => {
    const w = mountField('3')
    expect(w.find('.qty-value').element.value).toBe('3')
  })

  it('typing a whole number emits the value', async () => {
    const w = mountField('')
    await w.find('.qty-value').setValue('25')
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['25'])
  })

  it('typing a decimal emits a 2-decimal-rounded value', async () => {
    const w = mountField('')
    await w.find('.qty-value').setValue('1.555')
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['1.56'])
  })

  it('accepts comma as decimal separator', async () => {
    const w = mountField('')
    await w.find('.qty-value').setValue('2,5')
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['2.5'])
  })

  it('keeps unit when typing a new number', async () => {
    const w = mountField('200 g')
    await w.find('.qty-value').setValue('250')
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['250 g'])
  })

  it('plus/minus buttons keep the unit', async () => {
    const w = mountField('2 kg')
    await w.findAll('.step')[1].trigger('click')
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['3 kg'])
    await w.findAll('.step')[0].trigger('click')
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['2 kg'])
  })

  it('minus is disabled at 1', () => {
    const w = mountField('1')
    expect(w.findAll('.step')[0].attributes('disabled')).toBeDefined()
  })

  it('blur with empty draft resets to 1', async () => {
    const w = mountField('5')
    await w.find('.qty-value').setValue('')
    await w.find('.qty-value').trigger('blur')
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['1'])
  })

  it('unit pill selection updates value with unit', async () => {
    const w = mountField('3')
    await w.findAll('.unit-tag')[1].trigger('click')
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['3 g'])
  })
})
