import { toast as sonnerToast } from "sonner";
import { motion } from "framer-motion";
import { Check, X, AlertCircle, Info, Zap, Copy, Trash2, Edit, Share, QrCode } from "lucide-react";

const iconMap = {
  success: Check,
  error: X,
  warning: AlertCircle,
  info: Info,
  zap: Zap,
  copy: Copy,
  delete: Trash2,
  edit: Edit,
  share: Share,
  qr: QrCode
};

const colorMap = {
  success: "text-green-600 bg-green-50 border-green-200",
  error: "text-red-600 bg-red-50 border-red-200",
  warning: "text-orange-600 bg-orange-50 border-orange-200",
  info: "text-blue-600 bg-blue-50 border-blue-200",
  zap: "text-yellow-600 bg-yellow-50 border-yellow-200"
};

const MobileToast = ({ message, type = "info", icon, duration = 3000, action }) => {
  const IconComponent = icon ? iconMap[icon] : iconMap[type];
  const colorClass = colorMap[type] || colorMap.info;

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      className={`flex items-center space-x-3 p-4 rounded-xl border ${colorClass} shadow-lg backdrop-blur-sm`}
    >
      {IconComponent && (
        <motion.div
          initial={{ rotate: -180, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
        >
          <IconComponent className="w-5 h-5" />
        </motion.div>
      )}
      
      <div className="flex-1">
        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="font-medium text-sm"
        >
          {message}
        </motion.p>
      </div>

      {action && (
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          onClick={action.onClick}
          className="text-xs font-medium underline hover:no-underline"
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
};

// Enhanced toast functions with better mobile UX
export const mobileToast = {
  success: (message, options = {}) => {
    return sonnerToast.custom((t) => (
      <MobileToast
        message={message}
        type="success"
        icon={options.icon || "success"}
        {...options}
      />
    ), {
      duration: options.duration || 3000,
      position: "top-center"
    });
  },

  error: (message, options = {}) => {
    return sonnerToast.custom((t) => (
      <MobileToast
        message={message}
        type="error"
        icon={options.icon || "error"}
        {...options}
      />
    ), {
      duration: options.duration || 4000,
      position: "top-center"
    });
  },

  info: (message, options = {}) => {
    return sonnerToast.custom((t) => (
      <MobileToast
        message={message}
        type="info"
        icon={options.icon || "info"}
        {...options}
      />
    ), {
      duration: options.duration || 3000,
      position: "top-center"
    });
  },

  linkAction: (action, linkTitle, options = {}) => {
    const messages = {
      created: `Link "${linkTitle}" created successfully! 🚀`,
      updated: `Link "${linkTitle}" updated! ✨`,
      deleted: `Link "${linkTitle}" deleted`,
      copied: `URL copied to clipboard! 📋`,
      shared: `Link "${linkTitle}" shared! 📤`,
      qr: `QR code generated for "${linkTitle}"! 📱`,
      activated: `Link "${linkTitle}" activated! ⚡`,
      deactivated: `Link "${linkTitle}" hidden`,
      duplicated: `Link "${linkTitle}" duplicated! 📋`
    };

    const iconMap = {
      created: "zap",
      updated: "edit",
      deleted: "delete",
      copied: "copy",
      shared: "share",
      qr: "qr",
      activated: "zap",
      deactivated: "info",
      duplicated: "copy"
    };

    const type = ["deleted", "deactivated"].includes(action) ? "warning" : "success";

    return sonnerToast.custom((t) => (
      <MobileToast
        message={messages[action] || `Action completed for "${linkTitle}"`}
        type={type}
        icon={iconMap[action]}
        {...options}
      />
    ), {
      duration: options.duration || 3000,
      position: "top-center"
    });
  },

  loading: (message, promise, options = {}) => {
    return sonnerToast.promise(promise, {
      loading: (
        <MobileToast
          message={message}
          type="info"
          icon="info"
          {...options}
        />
      ),
      success: (data) => (
        <MobileToast
          message={options.successMessage || "Action completed successfully!"}
          type="success"
          icon="success"
          {...options}
        />
      ),
      error: (error) => (
        <MobileToast
          message={options.errorMessage || "Something went wrong"}
          type="error"
          icon="error"
          {...options}
        />
      )
    });
  }
};

export default MobileToast;