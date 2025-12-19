import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const transition = {
  type: "spring",
  mass: 0.5,
  damping: 11.5,
  stiffness: 100,
  restDelta: 0.001,
  restSpeed: 0.001,
};

export const MenuItem = ({
  setActive,
  active,
  item,
  children,
}) => {
  return (
    <div onMouseEnter={() => setActive(item)} className="relative">
      <motion.p
        transition={{ duration: 0.3 }}
        className="cursor-pointer text-slate-700 hover:text-slate-900 font-medium text-sm"
      >
        {item}
      </motion.p>
      {active !== null && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={transition}
        >
          {active === item && (
            <div className="absolute top-[calc(100%_+_1.2rem)] left-1/2 transform -translate-x-1/2 pt-4">
              <motion.div
                transition={transition}
                layoutId="active"
                className="bg-white backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-200 shadow-xl"
              >
                <motion.div
                  layout
                  className="w-max h-full p-4"
                >
                  {children}
                </motion.div>
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export const Menu = ({
  setActive,
  children,
}) => {
  return (
    <nav
      onMouseLeave={() => setActive(null)}
      className="relative rounded-full border border-slate-200 bg-white shadow-lg flex justify-center space-x-6 px-8 py-3"
    >
      {children}
    </nav>
  );
};

export const ProductItem = ({
  title,
  description,
  href,
  icon: Icon,
}) => {
  return (
    <Link to={href} className="flex space-x-3 group">
      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
        {Icon && <Icon className="w-6 h-6 text-white" />}
      </div>
      <div>
        <h4 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
          {title}
        </h4>
        <p className="text-slate-500 text-sm max-w-[12rem]">
          {description}
        </p>
      </div>
    </Link>
  );
};

export const HoveredLink = ({ children, href, onClick, ...rest }) => {
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="text-slate-600 hover:text-blue-600 transition-colors text-left w-full"
        {...rest}
      >
        {children}
      </button>
    );
  }
  
  if (href && href.startsWith('#')) {
    return (
      <a
        href={href}
        className="text-slate-600 hover:text-blue-600 transition-colors"
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      to={href || "/"}
      className="text-slate-600 hover:text-blue-600 transition-colors"
      {...rest}
    >
      {children}
    </Link>
  );
};

export default { Menu, MenuItem, ProductItem, HoveredLink };
