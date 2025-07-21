'use client'

import React, { ReactNode } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { getStripe, stripeElementsOptions } from '@/lib/stripe/client'

interface StripeProviderProps {
  children: ReactNode
  options?: {
    mode?: 'payment' | 'subscription' | 'setup'
    amount?: number
    currency?: string
    customer?: string
    payment_method_types?: string[]
    setup_intent_usage?: string
  }
}

export function StripeProvider({ children, options }: StripeProviderProps) {
  const stripePromise = getStripe()

  const elementsOptions = {
    ...stripeElementsOptions,
    mode: options?.mode || 'subscription',
    amount: options?.amount,
    currency: options?.currency || 'jpy',
    customer: options?.customer,
    payment_method_types: options?.payment_method_types || ['card'],
    setup_intent_usage: options?.setup_intent_usage,
  }

  return (
    <Elements stripe={stripePromise} options={elementsOptions}>
      {children}
    </Elements>
  )
}

// サブスクリプション専用プロバイダー
interface SubscriptionProviderProps {
  children: ReactNode
  customerId?: string
}

export function SubscriptionProvider({ children, customerId }: SubscriptionProviderProps) {
  return (
    <StripeProvider
      options={{
        mode: 'subscription',
        currency: 'jpy',
        customer: customerId,
        payment_method_types: ['card'],
      }}
    >
      {children}
    </StripeProvider>
  )
}

// 決済専用プロバイダー
interface PaymentProviderProps {
  children: ReactNode
  amount: number
  currency?: string
}

export function PaymentProvider({ children, amount, currency = 'jpy' }: PaymentProviderProps) {
  return (
    <StripeProvider
      options={{
        mode: 'payment',
        amount,
        currency,
        payment_method_types: ['card'],
      }}
    >
      {children}
    </StripeProvider>
  )
}

// Setup Intent専用プロバイダー（支払い方法の保存用）
interface SetupProviderProps {
  children: ReactNode
  customerId?: string
  usage?: 'on_session' | 'off_session'
}

export function SetupProvider({ children, customerId, usage = 'off_session' }: SetupProviderProps) {
  return (
    <StripeProvider
      options={{
        mode: 'setup',
        currency: 'jpy',
        customer: customerId,
        setup_intent_usage: usage,
        payment_method_types: ['card'],
      }}
    >
      {children}
    </StripeProvider>
  )
}