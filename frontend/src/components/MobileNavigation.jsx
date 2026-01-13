import { motion } from "framer-motion";
import { 
  Home,
  BarChart3,
  QrCode,
  Settings
} from "lucide-react";
import { addHapticFeedback } from "../utils/mobileUtils";

const MobileNavigation = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: "home", section: "links", label: "Home", icon: Home },
    { id: "stats", section: "analytics", label: "Stats", icon: BarChart3 },
    { id: "qr-codes", section: "qr-codes", label: "QR Code", icon: QrCode },
    { id: "settings", section: "profile", label: "Settings", icon: Settings }
  ];

  return (
    <>
      {/* Bottom Navigation Bar */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t border-border z-[100] safe-area-bottom pointer-events-auto"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
      >
        <div className="flex items-center justify-around px-2 py-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.section;
            const IconComponent = tab.icon;

            return (
              <motion.button
                key={tab.id}
                onClick={() => {
                  addHapticFeedback('light');
                  setActiveTab(tab.section);
                }}
                aria-label={`Open ${tab.label}`}
                className="flex flex-col items-center justify-center p-2 transition-all duration-200 min-w-[60px]"
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
              >
                <motion.div
                  animate={isActive ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className={`px-4 py-2 rounded-full transition-all duration-200 ${
                    isActive
                      ? "bg-blue-600 dark:bg-primary"
                      : "bg-transparent hover:bg-blue-100 dark:hover:bg-muted/50"
                  }`}
                >
                  <IconComponent className={`w-5 h-5 ${isActive ? "text-white dark:text-primary-foreground" : "text-gray-600 dark:text-foreground"}`} />
                </motion.div>
                <span className={`text-xs mt-1 font-medium ${isActive ? "text-blue-600 dark:text-primary" : "text-gray-600 dark:text-muted-foreground"}`}>
                  {tab.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Safe area spacer */}
      <div className="h-20" />
    </>
  );
};

export default MobileNavigation;