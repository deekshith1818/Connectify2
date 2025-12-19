"use client"
import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Link, useLocation } from "react-router-dom"
import { cn } from "../../lib/utils"
import { Video, LogOut } from "lucide-react"

/**
 * NavBar - Full-width white navbar with tubelight effect
 */
export function NavBar({ items, className, onLogout }) {
    const location = useLocation()
    const [isMobile, setIsMobile] = useState(false)
    const [activeTab, setActiveTab] = useState(items[0]?.name)

    // Auto-detect active tab based on current URL path
    useEffect(() => {
        const found = items.find(item => {
            if (item.url === '/' || item.url === '/home') {
                return location.pathname === '/' || location.pathname === '/home'
            }
            return location.pathname.startsWith(item.url)
        })
        if (found) {
            setActiveTab(found.name)
        }
    }, [location.pathname, items])

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768)
        handleResize()
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    return (
        <header className={cn(
            "sticky top-0 z-50 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm",
            className
        )}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Video className="h-5 w-5 text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Connectify</h1>
                    </div>

                    {/* Navigation Items with Tubelight Effect */}
                    <nav className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-full">
                        {items.map((item) => {
                            const Icon = item.icon
                            const isActive = activeTab === item.name

                            return (
                                <Link
                                    key={item.name}
                                    to={item.url}
                                    onClick={() => setActiveTab(item.name)}
                                    className="relative px-4 py-2 rounded-full transition-colors duration-200"
                                >
                                    {/* Background for active state */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="navbar-active-bg"
                                            className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-lg"
                                            style={{ 
                                                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
                                            }}
                                            initial={false}
                                            transition={{ 
                                                type: "spring", 
                                                stiffness: 380, 
                                                damping: 30 
                                            }}
                                        >
                                            {/* Tubelight glow on top */}
                                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-300 rounded-full blur-sm" />
                                        </motion.div>
                                    )}
                                    
                                    {/* Content */}
                                    <span className={cn(
                                        "relative z-10 flex items-center gap-2 text-sm font-medium transition-colors duration-200",
                                        isActive 
                                            ? "text-white" 
                                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                    )}>
                                        <Icon size={16} strokeWidth={2} />
                                        <span className="hidden md:inline">{item.name}</span>
                                    </span>
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Logout Button */}
                    {onLogout && (
                        <button
                            onClick={onLogout}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                        >
                            <LogOut size={18} />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    )}
                </div>
            </div>
        </header>
    )
}

export default NavBar
