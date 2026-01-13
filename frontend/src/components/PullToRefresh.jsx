import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { RefreshCw } from "lucide-react";

const PullToRefresh = ({ onRefresh, children, className = "" }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canPull, setCanPull] = useState(true);
  const constraintsRef = useRef(null);
  const y = useMotionValue(0);
  const containerRef = useRef(null);

  // Transform values for visual feedback
  const rotate = useTransform(y, [0, 100], [0, 360]);
  const scale = useTransform(y, [0, 100], [0.8, 1.2]);
  const opacity = useTransform(y, [0, 50, 100], [0, 0.5, 1]);

  const refreshThreshold = 80;

  const checkCanPull = () => {
    if (containerRef.current) {
      const scrollTop = containerRef.current.scrollTop;
      setCanPull(scrollTop <= 0);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', checkCanPull);
      return () => container.removeEventListener('scroll', checkCanPull);
    }
  }, []);

  const handleDragEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offset = info.offset.y;
    
    if (offset > refreshThreshold && canPull && !isRefreshing) {
      setIsRefreshing(true);
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  return (
    <div ref={constraintsRef} className={`relative ${className}`}>
      {/* Pull to Refresh Indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 z-10 flex items-center justify-center"
        style={{ opacity }}
        animate={{
          y: isRefreshing ? 60 : 0
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 40
        }}
      >
        <div className="bg-white rounded-full p-3 shadow-lg border border-gray-100">
          <motion.div
            style={{ rotate: isRefreshing ? undefined : rotate, scale }}
            animate={isRefreshing ? { rotate: 360 } : {}}
            transition={isRefreshing ? { 
              duration: 1, 
              repeat: Infinity, 
              ease: "linear" 
            } : {}}
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'text-blue-500' : 'text-gray-600'}`} />
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        ref={containerRef}
        drag={canPull && !isRefreshing ? "y" : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.3, bottom: 0 }}
        style={{ y }}
        onDragEnd={handleDragEnd}
        className="h-full overflow-auto"
        animate={{
          y: isRefreshing ? 60 : 0
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 40
        }}
      >
        {/* Pull instruction hint */}
        <motion.div
          className="text-center py-2 text-xs text-gray-400"
          style={{ opacity: useTransform(y, [0, 30], [0, 1]) }}
        >
          <motion.span
            animate={{
              opacity: y.get() > 30 ? [1, 0.5, 1] : 1
            }}
            transition={{
              duration: 1,
              repeat: y.get() > 30 ? Infinity : 0
            }}
          >
            {y.get() > refreshThreshold ? "Release to refresh" : "Pull down to refresh"}
          </motion.span>
        </motion.div>

        {children}
      </motion.div>
    </div>
  );
};

export default PullToRefresh;