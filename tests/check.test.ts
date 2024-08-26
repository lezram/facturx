import { describe, expect, test } from 'vitest'
import { check } from '../dist/index.mjs'

describe('check', () => {
  test('should autodetect facturx flavor and level', async () => {
    const xml = './examples/Facture_FR_EN16931.xml'
    const options = {
      xml,
      flavor: '',
      level: ''
    }
    const valid = await check(options)

    expect(valid).toBe(true)
    expect(options.flavor).toBe('facturx')
    expect(options.level).toBe('en16931')
  })

  test('should autodetect orderx flavor and level', async () => {
    const xml = './examples/ORDER-X_EX11_ORDER_PICK-UP-BASIC.xml'
    const options = {
      xml,
      flavor: '',
      level: ''
    }
    const valid = await check(options)

    expect(valid).toBe(true)
    expect(options.flavor).toBe('orderx')
    expect(options.level).toBe('basic')
  })

  test('should pass with flavor provided', async () => {
    const xml = './examples/Facture_FR_EN16931.xml'
    const options = {
      xml,
      flavor: 'facturx',
    }
    const valid = await check(options)

    expect(valid).toBe(true)
  })
  
  test('should pass with flavor and level provided', async () => {
    const xml = './examples/Facture_FR_EN16931.xml'
    const options = {
      xml,
      flavor: 'facturx',
      level: 'en16931'
    }
    const valid = await check(options)

    expect(valid).toBe(true)
  })

  test('should fail with invalid level', async () => {
    const xml = './examples/Facture_FR_EN16931.xml'
    const options = {
      xml,
      flavor: 'facturx',
      level: 'minimum'
    }
    const valid = await check(options)

    expect(valid).toBe(false)
  })

  test('should fail with invalid flavor', async () => {
    const xml = './examples/Facture_FR_EN16931.xml'
    const options = {
      xml,
      flavor: 'orderx',
      level: 'basic'
    }
    const valid = await check(options)

    expect(valid).toBe(false)
  })

  test('should throw if unknown flavor is provided', async () => {
    const xml = './examples/Facture_FR_EN16931.xml'
    const options = {
      xml,
      flavor: 'unknown'
    }

    expect(() => check(options)).rejects.toThrowError('Unknown schema flavor: "unknown"')
  })

  test('should throw if unknown facturx level is provided', async () => {
    const xml = './examples/Facture_FR_EN16931.xml'
    const options = {
      xml,
      flavor: 'facturx',
      level: 'unknown'
    }

    expect(() => check(options)).rejects.toThrowError('Unknown Factur-X level: "unknown"')
  })

  test('should throw if unknown orderx level is provided', async () => {
    const xml = './examples/Facture_FR_EN16931.xml'
    const options = {
      xml,
      flavor: 'orderx',
      level: 'unknown'
    }

    expect(() => check(options)).rejects.toThrowError('Unknown Order-X level: "unknown"')
  })
})
