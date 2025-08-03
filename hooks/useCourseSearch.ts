'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CourseSearchParams, CourseSortOption } from '@/types/course'

interface UseCourseSearchOptions {
  defaultParams?: Partial<CourseSearchParams>
  updateUrl?: boolean
}

export function useCourseSearch(options: UseCourseSearchOptions = {}) {
  const { defaultParams = {}, updateUrl = true } = options
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // 循環参照を避けるためuseRefを使用
  const paramsRef = useRef<CourseSearchParams>({
    search: '',
    sort: 'name',
    page: 1,
    limit: 20,
    ...defaultParams,
  })

  // URLパラメータから初期状態を構築（メモ化なし）
  const getInitialParams = (): CourseSearchParams => {
    const params: CourseSearchParams = {
      search: '',
      sort: 'name',
      page: 1,
      limit: 20,
      ...defaultParams,
    }

    if (updateUrl) {
      // URLパラメータから値を取得
      const urlSearch = searchParams.get('search')
      const urlDepartment = searchParams.get('department')
      const urlFaculty = searchParams.get('faculty')
      const urlCategory = searchParams.get('category')
      const urlSemester = searchParams.get('semester')
      const urlYear = searchParams.get('year')
      const urlCredits = searchParams.get('credits')
      const urlMinRating = searchParams.get('min_rating')
      const urlMaxDifficulty = searchParams.get('max_difficulty')
      const urlSort = searchParams.get('sort')
      const urlPage = searchParams.get('page')
      const urlLimit = searchParams.get('limit')

      if (urlSearch) params.search = urlSearch
      if (urlDepartment) params.department = urlDepartment
      if (urlFaculty) params.faculty = urlFaculty
      if (urlCategory) params.category = urlCategory
      if (urlSemester) params.semester = urlSemester
      if (urlYear) params.year = parseInt(urlYear)
      if (urlCredits) params.credits = parseInt(urlCredits)
      if (urlMinRating) params.min_rating = parseFloat(urlMinRating)
      if (urlMaxDifficulty) params.max_difficulty = parseFloat(urlMaxDifficulty)
      if (urlSort) params.sort = urlSort as CourseSortOption
      if (urlPage) params.page = parseInt(urlPage)
      if (urlLimit) params.limit = parseInt(urlLimit)
    }

    return params
  }

  const [params, setParams] = useState<CourseSearchParams>(() => {
    const initial = getInitialParams()
    paramsRef.current = initial
    return initial
  })

  // URLパラメータを更新（依存配列を最小化）
  const updateUrlParams = useCallback((newParams: CourseSearchParams) => {
    if (!updateUrl) return

    const url = new URL(window.location.href)
    const urlSearchParams = new URLSearchParams()

    // パラメータをURLに追加（空でない値のみ）
    Object.entries(newParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        urlSearchParams.set(key, value.toString())
      }
    })

    url.search = urlSearchParams.toString()
    router.push(url.pathname + url.search, { scroll: false })
  }, [router, updateUrl])

  // パラメータを更新（paramsへの直接依存を削除）
  const updateParams = useCallback((newParams: Partial<CourseSearchParams>) => {
    const updatedParams = { ...paramsRef.current, ...newParams }
    paramsRef.current = updatedParams
    setParams(updatedParams)
    updateUrlParams(updatedParams)
  }, [updateUrlParams])

  // 検索実行
  const search = useCallback((searchTerm: string) => {
    updateParams({ search: searchTerm, page: 1 })
  }, [updateParams])

  // フィルター更新
  const updateFilters = useCallback((filters: Partial<CourseSearchParams>) => {
    updateParams({ ...filters, page: 1 })
  }, [updateParams])

  // ページ変更
  const setPage = useCallback((page: number) => {
    updateParams({ page })
  }, [updateParams])

  // パラメータリセット
  const resetParams = useCallback(() => {
    const resetParams: CourseSearchParams = {
      search: '',
      sort: 'name',
      page: 1,
      limit: 20,
      ...defaultParams,
    }
    paramsRef.current = resetParams
    setParams(resetParams)
    updateUrlParams(resetParams)
  }, [defaultParams, updateUrlParams])

  // URLパラメータの変更を監視（getInitialParamsの依存を削除）
  useEffect(() => {
    const newParams = getInitialParams()
    
    // 実際に変更がある場合のみ更新
    const hasChanges = Object.keys(newParams).some(key => 
      newParams[key as keyof CourseSearchParams] !== paramsRef.current[key as keyof CourseSearchParams]
    )
    
    if (hasChanges) {
      paramsRef.current = newParams
      setParams(newParams)
    }
  }, [searchParams]) // searchParamsのみに依存

  return {
    params,
    updateParams,
    search,
    updateFilters,
    setPage,
    resetParams,
  }
}