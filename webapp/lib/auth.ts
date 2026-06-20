// Utility functions for authentication

export interface User {
  id: string
  username: string
  email: string
  password?: string
  loginMethod?: 'password' | 'google'
  createdAt: string
  picture?: string
}

export const authUtils = {
  // Register new user
  register: (userData: Omit<User, 'id' | 'createdAt'>): User => {
    const users = authUtils.getUsers()
    
    // Check if user already exists
    const existingUser = users.find(
      (u) => u.username === userData.username || u.email === userData.email
    )
    
    if (existingUser) {
      throw new Error('Username atau email sudah terdaftar')
    }

    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }

    users.push(newUser)
    localStorage.setItem('users', JSON.stringify(users))
    
    return newUser
  },

  // Login with username and password
  login: (username: string, password: string): User | null => {
    const users = authUtils.getUsers()
    const user = users.find(
      (u) => u.username === username && u.password === password
    )

    if (user) {
      authUtils.setSession(user)
      return user
    }

    return null
  },

  // Login with Google
  loginWithGoogle: (googleUser: {
    sub: string
    email: string
    name?: string
    picture?: string
  }): User => {
    const users = authUtils.getUsers()
    let user = users.find((u) => u.email === googleUser.email)

    if (!user) {
      // Create new user from Google
      user = {
        id: googleUser.sub,
        username: googleUser.name || googleUser.email.split('@')[0],
        email: googleUser.email,
        loginMethod: 'google',
        createdAt: new Date().toISOString(),
        picture: googleUser.picture,
      }
      users.push(user)
      localStorage.setItem('users', JSON.stringify(users))
    } else {
      // Update user info if needed
      if (googleUser.picture) user.picture = googleUser.picture
      if (googleUser.name) user.username = googleUser.name
      user.loginMethod = 'google'
    }

    authUtils.setSession(user)
    return user
  },

  // Get all users
  getUsers: (): User[] => {
    if (typeof window === 'undefined') return []
    return JSON.parse(localStorage.getItem('users') || '[]')
  },

  // Get current user
  getCurrentUser: (): User | null => {
    if (typeof window === 'undefined') return null
    
    const isAuthenticated = localStorage.getItem('isAuthenticated')
    if (isAuthenticated !== 'true') return null

    const userId = localStorage.getItem('userId')
    if (!userId) return null

    const users = authUtils.getUsers()
    return users.find((u) => u.id === userId) || null
  },

  // Set session
  setSession: (user: User): void => {
    if (typeof window === 'undefined') return
    
    localStorage.setItem('isAuthenticated', 'true')
    localStorage.setItem('username', user.username)
    localStorage.setItem('userEmail', user.email)
    localStorage.setItem('userId', user.id)
    if (user.loginMethod) {
      localStorage.setItem('loginMethod', user.loginMethod)
    }
    if (user.picture) {
      localStorage.setItem('userPicture', user.picture)
    }
  },

  // Logout
  logout: (): void => {
    if (typeof window === 'undefined') return
    
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('username')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('userId')
    localStorage.removeItem('loginMethod')
    localStorage.removeItem('userPicture')
  },

  // Check if authenticated
  isAuthenticated: (): boolean => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('isAuthenticated') === 'true'
  },
}

