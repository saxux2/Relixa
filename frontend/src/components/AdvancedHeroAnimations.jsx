import React from 'react';
export const ANIMATION_TIMELINES = {
  sequence_0: {
    duration: 0.83,
    ease: 'power2.inOut',
    delay: 0.94,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 29 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase0'
  },
  sequence_1: {
    duration: 0.21,
    ease: 'power2.inOut',
    delay: 0.81,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 18 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase1'
  },
  sequence_2: {
    duration: 1.30,
    ease: 'power2.inOut',
    delay: 0.75,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 9 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase2'
  },
  sequence_3: {
    duration: 1.75,
    ease: 'power2.inOut',
    delay: 0.50,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 4 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase3'
  },
  sequence_4: {
    duration: 1.97,
    ease: 'power2.inOut',
    delay: 0.62,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 40 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase4'
  },
  sequence_5: {
    duration: 0.50,
    ease: 'power2.inOut',
    delay: 0.60,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 0 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase5'
  },
  sequence_6: {
    duration: 1.83,
    ease: 'power2.inOut',
    delay: 0.57,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 22 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase6'
  },
  sequence_7: {
    duration: 1.60,
    ease: 'power2.inOut',
    delay: 0.02,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 35 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase7'
  },
  sequence_8: {
    duration: 1.63,
    ease: 'power2.inOut',
    delay: 0.23,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 7 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase8'
  },
  sequence_9: {
    duration: 0.75,
    ease: 'power2.inOut',
    delay: 0.05,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 40 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase9'
  },
  sequence_10: {
    duration: 1.04,
    ease: 'power2.inOut',
    delay: 0.17,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 28 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase10'
  },
  sequence_11: {
    duration: 0.29,
    ease: 'power2.inOut',
    delay: 0.94,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 29 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase11'
  },
  sequence_12: {
    duration: 0.57,
    ease: 'power2.inOut',
    delay: 0.96,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 2 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase12'
  },
  sequence_13: {
    duration: 0.05,
    ease: 'power2.inOut',
    delay: 0.56,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 29 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase13'
  },
  sequence_14: {
    duration: 1.15,
    ease: 'power2.inOut',
    delay: 0.48,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 15 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase14'
  },
  sequence_15: {
    duration: 0.84,
    ease: 'power2.inOut',
    delay: 0.99,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 27 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase15'
  },
  sequence_16: {
    duration: 1.82,
    ease: 'power2.inOut',
    delay: 0.03,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 22 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase16'
  },
  sequence_17: {
    duration: 2.00,
    ease: 'power2.inOut',
    delay: 0.48,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 30 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase17'
  },
  sequence_18: {
    duration: 0.96,
    ease: 'power2.inOut',
    delay: 0.86,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 26 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase18'
  },
  sequence_19: {
    duration: 0.06,
    ease: 'power2.inOut',
    delay: 0.20,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 22 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase19'
  },
  sequence_20: {
    duration: 1.31,
    ease: 'power2.inOut',
    delay: 0.22,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 35 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase20'
  },
  sequence_21: {
    duration: 0.80,
    ease: 'power2.inOut',
    delay: 0.96,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 18 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase21'
  },
  sequence_22: {
    duration: 0.62,
    ease: 'power2.inOut',
    delay: 0.65,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 22 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase22'
  },
  sequence_23: {
    duration: 1.39,
    ease: 'power2.inOut',
    delay: 0.11,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 36 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase23'
  },
  sequence_24: {
    duration: 0.67,
    ease: 'power2.inOut',
    delay: 0.91,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 37 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase24'
  },
  sequence_25: {
    duration: 0.50,
    ease: 'power2.inOut',
    delay: 0.45,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 16 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase25'
  },
  sequence_26: {
    duration: 0.93,
    ease: 'power2.inOut',
    delay: 0.15,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 12 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase26'
  },
  sequence_27: {
    duration: 1.61,
    ease: 'power2.inOut',
    delay: 0.70,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 4 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase27'
  },
  sequence_28: {
    duration: 1.15,
    ease: 'power2.inOut',
    delay: 0.40,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 9 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase28'
  },
  sequence_29: {
    duration: 1.74,
    ease: 'power2.inOut',
    delay: 0.98,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 5 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase29'
  },
  sequence_30: {
    duration: 1.20,
    ease: 'power2.inOut',
    delay: 0.69,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 10 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase30'
  },
  sequence_31: {
    duration: 0.13,
    ease: 'power2.inOut',
    delay: 0.83,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 37 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase31'
  },
  sequence_32: {
    duration: 1.80,
    ease: 'power2.inOut',
    delay: 0.77,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 31 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase32'
  },
  sequence_33: {
    duration: 1.34,
    ease: 'power2.inOut',
    delay: 0.15,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 19 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase33'
  },
  sequence_34: {
    duration: 1.92,
    ease: 'power2.inOut',
    delay: 0.05,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 23 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase34'
  },
  sequence_35: {
    duration: 0.23,
    ease: 'power2.inOut',
    delay: 0.91,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 5 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase35'
  },
  sequence_36: {
    duration: 0.32,
    ease: 'power2.inOut',
    delay: 0.78,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 1 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase36'
  },
  sequence_37: {
    duration: 1.36,
    ease: 'power2.inOut',
    delay: 0.64,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 20 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase37'
  },
  sequence_38: {
    duration: 1.30,
    ease: 'power2.inOut',
    delay: 0.23,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 27 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase38'
  },
  sequence_39: {
    duration: 1.66,
    ease: 'power2.inOut',
    delay: 0.66,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 21 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase39'
  },
  sequence_40: {
    duration: 1.47,
    ease: 'power2.inOut',
    delay: 0.11,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 3 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase40'
  },
  sequence_41: {
    duration: 1.79,
    ease: 'power2.inOut',
    delay: 0.26,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 31 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase41'
  },
  sequence_42: {
    duration: 0.31,
    ease: 'power2.inOut',
    delay: 0.81,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 16 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase42'
  },
  sequence_43: {
    duration: 1.96,
    ease: 'power2.inOut',
    delay: 0.26,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 16 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase43'
  },
  sequence_44: {
    duration: 1.59,
    ease: 'power2.inOut',
    delay: 0.01,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 13 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase44'
  },
  sequence_45: {
    duration: 0.43,
    ease: 'power2.inOut',
    delay: 0.24,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 23 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase45'
  },
  sequence_46: {
    duration: 1.64,
    ease: 'power2.inOut',
    delay: 0.64,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 3 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase46'
  },
  sequence_47: {
    duration: 0.58,
    ease: 'power2.inOut',
    delay: 0.99,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 26 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase47'
  },
  sequence_48: {
    duration: 0.44,
    ease: 'power2.inOut',
    delay: 0.33,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 28 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase48'
  },
  sequence_49: {
    duration: 1.63,
    ease: 'power2.inOut',
    delay: 0.64,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 2 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase49'
  },
  sequence_50: {
    duration: 1.14,
    ease: 'power2.inOut',
    delay: 0.24,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 43 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase50'
  },
  sequence_51: {
    duration: 1.57,
    ease: 'power2.inOut',
    delay: 0.65,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 12 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase51'
  },
  sequence_52: {
    duration: 0.62,
    ease: 'power2.inOut',
    delay: 0.79,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 41 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase52'
  },
  sequence_53: {
    duration: 1.55,
    ease: 'power2.inOut',
    delay: 0.05,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 13 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase53'
  },
  sequence_54: {
    duration: 1.57,
    ease: 'power2.inOut',
    delay: 0.18,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 34 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase54'
  },
  sequence_55: {
    duration: 0.39,
    ease: 'power2.inOut',
    delay: 0.78,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 16 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase55'
  },
  sequence_56: {
    duration: 0.06,
    ease: 'power2.inOut',
    delay: 0.64,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 33 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase56'
  },
  sequence_57: {
    duration: 0.88,
    ease: 'power2.inOut',
    delay: 0.42,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 43 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase57'
  },
  sequence_58: {
    duration: 0.69,
    ease: 'power2.inOut',
    delay: 0.63,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 13 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase58'
  },
  sequence_59: {
    duration: 0.04,
    ease: 'power2.inOut',
    delay: 0.41,
    keyframes: {
      '0%': { opacity: 0, scale: 0.8, x: -50, y: 20, rotation: 17 },
      '50%': { opacity: 0.5, scale: 1.1, x: 0, y: -10, rotation: 0 },
      '100%': { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    },
    stagger: 0.1,
    transformOrigin: 'center center',
    onComplete: 'triggerNextPhase59'
  },
};

export default function AdvancedHero() { return <div>Advanced Hero</div>; }