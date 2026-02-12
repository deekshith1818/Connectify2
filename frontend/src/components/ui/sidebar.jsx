import { cn } from "../../lib/utils";
import { Link } from "react-router-dom";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";

const SidebarContext = createContext(undefined);

export const useSidebar = () => {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error("useSidebar must be used within a SidebarProvider");
    }
    return context;
};

export const SidebarProvider = ({
    children,
    open: openProp,
    setOpen: setOpenProp,
    animate = true,
}) => {
    const [openState, setOpenState] = useState(false);

    const open = openProp !== undefined ? openProp : openState;
    const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

    return (
        <SidebarContext.Provider value={{ open, setOpen, animate }}>
            {children}
        </SidebarContext.Provider>
    );
};

export const Sidebar = ({
    children,
    open,
    setOpen,
    animate,
}) => {
    return (
        <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
            {children}
        </SidebarProvider>
    );
};

export const SidebarBody = (props) => {
    return (
        <>
            <DesktopSidebar {...props} />
            <MobileSidebar {...props} />
        </>
    );
};

export const DesktopSidebar = ({
    className,
    children,
    ...props
}) => {
    const { open, setOpen, animate } = useSidebar();
    return (
        <motion.div
            className={cn(
                "h-full px-4 py-4 hidden md:flex md:flex-col bg-slate-800 border-r border-slate-700 flex-shrink-0 relative",
                className
            )}
            animate={{
                width: animate ? (open ? "280px" : "70px") : "280px",
            }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            {...props}
        >
            {/* Toggle button */}
            <button
                onClick={() => setOpen(!open)}
                className="absolute -right-3 top-6 z-50 w-6 h-6 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center hover:bg-slate-600 transition-colors"
            >
                <motion.svg
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-3 h-3 text-slate-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </motion.svg>
            </button>
            {children}
        </motion.div>
    );
};

export const MobileSidebar = ({
    className,
    children,
    ...props
}) => {
    const { open, setOpen } = useSidebar();
    return (
        <>
            <div
                className={cn(
                    "h-14 px-4 flex flex-row md:hidden items-center justify-between bg-slate-800 border-b border-slate-700 w-full"
                )}
                {...props}
            >
                <div className="flex justify-end z-20 w-full">
                    <Menu
                        className="text-slate-200 cursor-pointer h-6 w-6"
                        onClick={() => setOpen(!open)}
                    />
                </div>
                <AnimatePresence>
                    {open && (
                        <motion.div
                            initial={{ x: "-100%", opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: "-100%", opacity: 0 }}
                            transition={{
                                duration: 0.3,
                                ease: "easeInOut",
                            }}
                            className={cn(
                                "fixed h-full w-full inset-0 bg-slate-900 p-6 z-[100] flex flex-col justify-between",
                                className
                            )}
                        >
                            <div
                                className="absolute right-6 top-6 z-50 text-slate-200 cursor-pointer"
                                onClick={() => setOpen(!open)}
                            >
                                <X className="h-6 w-6" />
                            </div>
                            {children}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
};

export const SidebarLink = ({
    link,
    className,
    onClick,
    ...props
}) => {
    const { open, animate } = useSidebar();
    
    // If it's a button action (like logout), use a button instead of Link
    if (link.onClick) {
        return (
            <button
                onClick={link.onClick}
                className={cn(
                    "flex items-center justify-start gap-3 group/sidebar py-2.5 px-2 rounded-lg hover:bg-slate-700/50 transition-colors w-full text-left",
                    className
                )}
                {...props}
            >
                {link.icon}
                <motion.span
                    animate={{
                        display: animate ? (open ? "inline-block" : "none") : "inline-block",
                        opacity: animate ? (open ? 1 : 0) : 1,
                    }}
                    className="text-slate-200 text-sm font-medium group-hover/sidebar:text-white transition duration-150 whitespace-pre"
                >
                    {link.label}
                </motion.span>
            </button>
        );
    }
    
    return (
        <Link
            to={link.href}
            className={cn(
                "flex items-center justify-start gap-3 group/sidebar py-2.5 px-2 rounded-lg hover:bg-slate-700/50 transition-colors",
                className
            )}
            onClick={onClick}
            {...props}
        >
            {link.icon}
            <motion.span
                animate={{
                    display: animate ? (open ? "inline-block" : "none") : "inline-block",
                    opacity: animate ? (open ? 1 : 0) : 1,
                }}
                className="text-slate-200 text-sm font-medium group-hover/sidebar:text-white transition duration-150 whitespace-pre"
            >
                {link.label}
            </motion.span>
        </Link>
    );
};

// Custom component for non-link items (like AI panel toggle)
export const SidebarItem = ({
    icon,
    label,
    onClick,
    className,
    active = false,
    ...props
}) => {
    const { open, setOpen, animate } = useSidebar();
    
    const handleClick = () => {
        // If sidebar is closed, open it first
        if (!open) {
            setOpen(true);
        }
        // Call the original onClick handler
        if (onClick) onClick();
    };
    
    return (
        <button
            onClick={handleClick}
            className={cn(
                "flex items-center justify-start gap-3 py-2.5 px-2 rounded-lg transition-colors w-full text-left",
                active 
                    ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-purple-500/30" 
                    : "hover:bg-slate-700/50",
                className
            )}
            {...props}
        >
            {icon}
            <motion.span
                animate={{
                    display: animate ? (open ? "inline-block" : "none") : "inline-block",
                    opacity: animate ? (open ? 1 : 0) : 1,
                }}
                className={cn(
                    "text-sm font-medium transition duration-150 whitespace-pre",
                    active ? "text-purple-300" : "text-slate-200"
                )}
            >
                {label}
            </motion.span>
        </button>
    );
};
