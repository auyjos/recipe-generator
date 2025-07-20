// Development logging utility
// Only logs messages when in development mode

const isDev = process.env.NODE_ENV === 'development'

export const logger = {
    log: (...args: any[]) => {
        if (isDev) {
            console.log(...args)
        }
    },

    warn: (...args: any[]) => {
        if (isDev) {
            console.warn(...args)
        }
    },

    error: (...args: any[]) => {
        // Always log errors, even in production
        console.error(...args)
    },

    info: (...args: any[]) => {
        if (isDev) {
            console.info(...args)
        }
    },

    debug: (...args: any[]) => {
        if (isDev) {
            console.debug(...args)
        }
    },

    // Helper method to check if we're in development
    isDev: () => isDev,

    // Specialized logging methods for our app
    api: {
        start: (endpoint: string, data?: any) => {
            if (isDev) {
                console.log(`🚀 ==> ${endpoint.toUpperCase()} API START <==`)
                if (data) {
                    console.log('📥 Request Data:', JSON.stringify(data, null, 2))
                }
                console.log('⏰ Timestamp:', new Date().toISOString())
            }
        },

        end: (endpoint: string) => {
            if (isDev) {
                console.log(`🏁 ==> ${endpoint.toUpperCase()} API END <==`)
            }
        },

        success: (message: string, data?: any) => {
            if (isDev) {
                console.log(`✅ ${message}`)
                if (data) {
                    console.log(data)
                }
            }
        },

        request: (message: string, data?: any) => {
            if (isDev) {
                console.log(`📤 ${message}`)
                if (data) {
                    console.log(JSON.stringify(data, null, 2))
                }
            }
        },

        response: (message: string, data?: any) => {
            if (isDev) {
                console.log(`📥 ${message}`)
                if (data) {
                    console.log(data)
                }
            }
        }
    },

    recipe: {
        generation: (message: string, data?: any) => {
            if (isDev) {
                console.log(`🔧 ${message}`)
                if (data) {
                    console.log(JSON.stringify(data, null, 2))
                }
            }
        },

        nutrition: (message: string, data?: any) => {
            if (isDev) {
                console.log(`🥗 ${message}`)
                if (data) {
                    console.log(data)
                }
            }
        },

        update: (message: string, data?: any) => {
            if (isDev) {
                console.log(`🔄 ${message}`)
                if (data) {
                    console.log(data)
                }
            }
        }
    }
}

export default logger
