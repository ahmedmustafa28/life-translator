// Helper to get cookies in browser or fake them in node
function getCookie(name: string): string | null {
  if (typeof window === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return decodeURIComponent(parts.pop()!.split(';').shift()!)
  return null
}

function setCookie(name: string, value: string, days = 7) {
  if (typeof window === 'undefined') return
  const date = new Date()
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
  const expires = `; expires=${date.toUTCString()}`
  document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/`
}

function eraseCookie(name: string) {
  if (typeof window === 'undefined') return
  document.cookie = `${name}=; Max-Age=-99999999; path=/`
}

// Chainable query builder mock
class MockQueryBuilder {
  private tableName: string
  private filters: { key: string; val: any }[] = []
  private isSingle = false

  constructor(tableName: string) {
    this.tableName = tableName
  }

  select(fields = '*') {
    return this
  }

  insert(payload: any) {
    // Return a promise directly for insert
    const promise = (async () => {
      try {
        const res = await fetch(`/api/mock-db?table=${this.tableName}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const result = await res.json()
        return { data: result.data, error: result.error ? new Error(result.error) : null }
      } catch (err: any) {
        return { data: null, error: err }
      }
    })()
    return Object.assign(promise, {
      select: () => promise,
      single: () => promise
    })
  }

  update(payload: any) {
    // Needs .eq() to execute, so we return a thenable that runs the update when resolved
    const runUpdate = async () => {
      try {
        const idFilter = this.filters.find(f => f.key === 'id')
        if (!idFilter) throw new Error('Missing ID filter for update')
        const res = await fetch(`/api/mock-db?table=${this.tableName}&id=${idFilter.val}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const result = await res.json()
        return { data: result.data, error: result.error ? new Error(result.error) : null }
      } catch (err: any) {
        return { data: null, error: err }
      }
    }

    return {
      eq: (key: string, val: any) => {
        this.filters.push({ key, val })
        // Return a Promise-like object (thenable)
        return {
          then: (onfulfilled: any) => runUpdate().then(onfulfilled)
        }
      }
    }
  }

  delete() {
    const runDelete = async () => {
      try {
        const idFilter = this.filters.find(f => f.key === 'id')
        if (!idFilter) throw new Error('Missing ID filter for delete')
        const res = await fetch(`/api/mock-db?table=${this.tableName}&id=${idFilter.val}`, {
          method: 'DELETE'
        })
        const result = await res.json()
        return { data: null, error: result.error ? new Error(result.error) : null }
      } catch (err: any) {
        return { data: null, error: err }
      }
    }

    return {
      eq: (key: string, val: any) => {
        this.filters.push({ key, val })
        return {
          then: (onfulfilled: any) => runDelete().then(onfulfilled)
        }
      }
    }
  }

  eq(key: string, val: any) {
    this.filters.push({ key, val })
    return this
  }

  order(key: string, options: any) {
    return this
  }

  single() {
    this.isSingle = true
    return this
  }

  // To make it awaitable like a standard Promise
  async then(onfulfilled: any, onrejected?: any) {
    try {
      const idFilter = this.filters.find(f => f.key === 'id')
      const userIdFilter = this.filters.find(f => f.key === 'user_id')

      let url = `/api/mock-db?table=${this.tableName}`
      if (idFilter) url += `&id=${idFilter.val}`
      if (userIdFilter) url += `&user_id=${userIdFilter.val}`

      const res = await fetch(url)
      const result = await res.json()

      let data = result.data
      if (this.isSingle && Array.isArray(data)) {
        data = data[0] || null
      }

      return onfulfilled({ data, error: null })
    } catch (err: any) {
      if (onrejected) return onrejected(err)
      return onfulfilled({ data: null, error: err })
    }
  }
}

export function getMockSupabaseClient(isBrowser: boolean, cookieStore?: any) {
  return {
    auth: {
      async getUser() {
        let cookieVal = null
        if (isBrowser) {
          cookieVal = getCookie('sb-mock-user')
        } else if (cookieStore) {
          const c = cookieStore.get('sb-mock-user')
          cookieVal = c ? c.value : null
        }
        if (!cookieVal) {
          return { data: { user: null }, error: null }
        }
        try {
          const decoded = cookieVal.startsWith('%') ? decodeURIComponent(cookieVal) : cookieVal
          const user = JSON.parse(decoded)
          return { data: { user }, error: null }
        } catch {
          return { data: { user: null }, error: null }
        }
      },

      async signUp({ email, password, options }: any) {
        try {
          const res = await fetch('/api/mock-db?table=users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              password,
              full_name: options?.data?.full_name || ''
            })
          })
          const result = await res.json()
          if (!res.ok) {
            return { data: null, error: new Error(result.error || 'Signup failed') }
          }
          const user = result.data
          return { data: { user }, error: null }
        } catch (err: any) {
          return { data: null, error: err }
        }
      },

      async signInWithPassword({ email, password }: any) {
        try {
          const res = await fetch(`/api/mock-db?table=users&email=${encodeURIComponent(email)}`)
          const result = await res.json()
          const user = result.data
          if (!user || user.password !== password) {
            return { data: null, error: new Error('Invalid login credentials') }
          }
          setCookie('sb-mock-user', JSON.stringify(user))
          return { data: { user }, error: null }
        } catch (err: any) {
          return { data: null, error: err }
        }
      },

      async signOut() {
        eraseCookie('sb-mock-user')
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login'
        }
        return { error: null }
      },

      onAuthStateChange(callback: (event: any, session: any) => void) {
        let session = null
        let cookieVal = null
        if (isBrowser) {
          cookieVal = getCookie('sb-mock-user')
        } else if (cookieStore) {
          const c = cookieStore.get('sb-mock-user')
          cookieVal = c ? c.value : null
        }
        if (cookieVal) {
          try {
            const decoded = cookieVal.startsWith('%') ? decodeURIComponent(cookieVal) : cookieVal
            session = { user: JSON.parse(decoded) }
          } catch {
            // Ignore
          }
        }
        callback('INITIAL_SESSION', session)
        return {
          data: {
            subscription: {
              unsubscribe() {
                console.log('[Mock Auth] Unsubscribed from auth state changes')
              }
            }
          }
        }
      }
    },

    from(tableName: string) {
      return new MockQueryBuilder(tableName)
    },

    storage: {
      from(bucketName: string) {
        return {
          async upload(filePath: string, file: File, options?: any) {
            console.log(`[Mock Storage] Uploading ${file.name} to path ${filePath}`)
            return {
              data: { path: filePath },
              error: null
            }
          },

          async download(filePath: string) {
            console.log(`[Mock Storage] Downloading file from path ${filePath}`)
            const blob = new Blob(['mock_content'], { type: 'text/plain' })
            return {
              data: blob,
              error: null
            }
          },

          async createSignedUrl(filePath: string, expires: number) {
            return {
              data: { signedUrl: `/api/mock-db?download=true&path=${encodeURIComponent(filePath)}` },
              error: null
            }
          },

          async remove(filePaths: string[]) {
            console.log(`[Mock Storage] Removed file paths:`, filePaths)
            return {
              error: null
            }
          }
        }
      }
    }
  }
}
