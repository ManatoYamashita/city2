'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Users, 
  Search, 
  Filter, 
  MoreHorizontal,
  UserCheck,
  UserX,
  Shield,
  DollarSign,
  Mail,
  Calendar,
  Trash2,
  RefreshCw
} from 'lucide-react'
import { UserManagementData, UserFilters } from '@/types/admin'

interface UserActionsProps {
  user: UserManagementData
  onAction: (action: string, userId: string) => void
}

function UserActions({ user, onAction }: UserActionsProps) {
  const [showActions, setShowActions] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'suspended': return 'bg-yellow-500'
      case 'deleted': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => setShowActions(!showActions)}
      >
        <MoreHorizontal className="w-4 h-4" />
      </Button>
      
      {showActions && (
        <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg z-10 min-w-48">
          <div className="p-2 space-y-1">
            {user.status === 'active' ? (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-yellow-600"
                onClick={() => {
                  onAction('suspend', user.id)
                  setShowActions(false)
                }}
              >
                <UserX className="w-4 h-4 mr-2" />
                アカウント停止
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-green-600"
                onClick={() => {
                  onAction('activate', user.id)
                  setShowActions(false)
                }}
              >
                <UserCheck className="w-4 h-4 mr-2" />
                アカウント再開
              </Button>
            )}
            
            {!user.is_premium && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-purple-600"
                onClick={() => {
                  onAction('upgrade_to_premium', user.id)
                  setShowActions(false)
                }}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                プレミアムに変更
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-blue-600"
              onClick={() => {
                onAction('reset_password', user.id)
                setShowActions(false)
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              パスワードリセット
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-blue-600"
              onClick={() => {
                window.open(`mailto:${user.email}`, '_blank')
                setShowActions(false)
              }}
            >
              <Mail className="w-4 h-4 mr-2" />
              メール送信
            </Button>

            <div className="border-t pt-1 mt-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-red-600"
                onClick={() => {
                  if (confirm('このユーザーを削除してもよろしいですか？この操作は取り消せません。')) {
                    onAction('delete', user.id)
                    setShowActions(false)
                  }
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                ユーザー削除
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserManagementData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    status: undefined,
    is_premium: undefined,
  })

  const [searchInput, setSearchInput] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [page, filters])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.is_premium !== undefined && { is_premium: filters.is_premium.toString() }),
        ...(filters.registration_date_from && { registration_date_from: filters.registration_date_from }),
        ...(filters.registration_date_to && { registration_date_to: filters.registration_date_to }),
      })

      const response = await fetch(`/api/admin/users?${queryParams}`)
      if (!response.ok) {
        throw new Error('ユーザーデータの取得に失敗しました')
      }

      const data = await response.json()
      setUsers(data.users)
      setTotalCount(data.total_count)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch users:', err)
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, search: searchInput }))
    setPage(1)
  }

  const handleAction = async (action: string, userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) {
        throw new Error('アクションの実行に失敗しました')
      }

      // データを再取得
      await fetchUsers()
      
      alert('アクションが正常に実行されました')
    } catch (err) {
      console.error('Failed to execute action:', err)
      alert(err instanceof Error ? err.message : 'アクションの実行に失敗しました')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">アクティブ</Badge>
      case 'suspended':
        return <Badge className="bg-yellow-500">停止中</Badge>
      case 'deleted':
        return <Badge className="bg-red-500">削除済み</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(amount)
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-8 h-8" />
            ユーザー管理
          </h1>
          <p className="text-gray-600 mt-2">
            登録ユーザーの管理とアカウント操作
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchUsers}>
            <RefreshCw className="w-4 h-4 mr-2" />
            更新
          </Button>
        </div>
      </div>

      {/* フィルター */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            フィルター・検索
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex gap-2">
              <Input
                placeholder="メールアドレスで検索"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch}>
                <Search className="w-4 h-4" />
              </Button>
            </div>

            <Select value={filters.status || ''} onValueChange={(value) => 
              setFilters(prev => ({ ...prev, status: value || undefined }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="ステータス" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">すべて</SelectItem>
                <SelectItem value="active">アクティブ</SelectItem>
                <SelectItem value="suspended">停止中</SelectItem>
                <SelectItem value="deleted">削除済み</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.is_premium?.toString() || ''} onValueChange={(value) => 
              setFilters(prev => ({ 
                ...prev, 
                is_premium: value === '' ? undefined : value === 'true' 
              }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="プラン" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">すべて</SelectItem>
                <SelectItem value="true">プレミアム</SelectItem>
                <SelectItem value="false">無料</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ユーザーリスト */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>ユーザー一覧</CardTitle>
              <CardDescription>
                {totalCount.toLocaleString()}件のユーザー（{page}ページ / {totalPages}ページ）
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              エラー: {error}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              条件に一致するユーザーが見つかりません
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                    <div className="md:col-span-2">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">{user.email}</p>
                          <p className="text-sm text-gray-500">
                            登録: {new Date(user.created_at).toLocaleDateString('ja-JP')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="text-center">
                      {getStatusBadge(user.status)}
                    </div>

                    <div className="text-center">
                      {user.is_premium ? (
                        <Badge className="bg-purple-500">プレミアム</Badge>
                      ) : (
                        <Badge variant="outline">無料</Badge>
                      )}
                    </div>

                    <div className="text-center">
                      <p className="text-sm font-medium">{user.review_count}件</p>
                      <p className="text-xs text-gray-500">レビュー</p>
                    </div>

                    <div className="text-center">
                      <p className="text-sm font-medium">{formatCurrency(user.total_spent)}</p>
                      <p className="text-xs text-gray-500">累計支払い</p>
                    </div>
                  </div>

                  <UserActions user={user} onAction={handleAction} />
                </div>
              ))}
            </div>
          )}

          {/* ページネーション */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-6">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                前のページ
              </Button>
              <span className="text-sm text-gray-600">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                次のページ
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}