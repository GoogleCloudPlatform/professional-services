/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Box } from '@mui/material'

interface AudioVisualizerProps {
  isActive: boolean
  isThinking?: boolean
  isInterrupted?: boolean
  isAwaitingInput?: boolean
  variant?: 'orb' | 'bars'
}

export const AudioVisualizer = ({ 
  isActive, 
  isThinking = false, 
  isInterrupted = false, 
  isAwaitingInput = false,
  variant = 'orb' 
}: AudioVisualizerProps) => {
  if (variant === 'bars') {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.5,
          height: 40,
          width: '100%',
        }}
      >
        {[...Array(5)].map((_, i) => (
          <Box
            key={i}
            sx={{
              width: 4,
              height: isActive || isAwaitingInput ? '100%' : '20%',
              bgcolor: isAwaitingInput ? '#FFB300' : 'primary.main',
              borderRadius: 1,
              transition: 'height 0.1s ease-in-out, background-color 0.3s ease',
              animation: isActive || isAwaitingInput ? `wave 1s infinite ease-in-out ${i * 0.1}s` : 'none',
              '@keyframes wave': {
                '0%, 100%': { height: '20%' },
                '50%': { height: '100%' },
              },
            }}
          />
        ))}
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        width: 300,
        height: 300,
      }}
    >
      {/* Background ambient pulse */}
      <Box
        sx={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: isAwaitingInput
            ? 'radial-gradient(circle, rgba(255,179,0,0.15) 0%, rgba(255,179,0,0) 60%)'
            : 'radial-gradient(circle, rgba(0,191,165,0.1) 0%, rgba(0,158,37,0) 60%)',
          animation: isActive || isAwaitingInput ? 'ambient-pulse 1.5s infinite alternate ease-in-out' : 'ambient-pulse-idle 4s infinite alternate ease-in-out',
          '@keyframes ambient-pulse': {
            '0%': { transform: 'scale(0.8)', opacity: 0.5 },
            '100%': { transform: 'scale(1.1)', opacity: 0.8 },
          },
          '@keyframes ambient-pulse-idle': {
            '0%': { transform: 'scale(0.9)', opacity: 0.2 },
            '100%': { transform: 'scale(1.05)', opacity: 0.4 },
          }
        }}
      />
      
      {/* Vertical Data Particles */}
      {[
        { id: 1, startLeft: '15%', endTranslateX: '50px', duration: '4s', delay: '0s', height: 40 },
        { id: 2, startLeft: '85%', endTranslateX: '-50px', duration: '5s', delay: '1.2s', height: 30 },
        { id: 3, startLeft: '30%', endTranslateX: '20px', duration: '3.5s', delay: '0.5s', height: 50 },
        { id: 4, startLeft: '70%', endTranslateX: '-20px', duration: '4.5s', delay: '2s', height: 35 },
        { id: 5, startLeft: '50%', endTranslateX: '0px', duration: '6s', delay: '1s', height: 45 },
      ].map((particle) => (
        <Box
          key={particle.id}
          sx={{
            position: 'absolute',
            bottom: '-20%',
            left: particle.startLeft,
            width: '2px',
            height: particle.height,
            background: isAwaitingInput
              ? 'linear-gradient(to top, rgba(255,179,0,0) 0%, rgba(255,179,0,0.6) 50%, rgba(255,255,255,0.9) 100%)'
              : 'linear-gradient(to top, rgba(0,191,165,0) 0%, rgba(0,191,165,0.6) 50%, rgba(255,255,255,0.9) 100%)',
            borderRadius: '2px',
            filter: 'blur(1px)',
            opacity: 0,
            zIndex: 0,
            animation: isActive || isAwaitingInput
              ? `data-particle-drift-${particle.id}-active ${particle.duration} ease-in infinite ${particle.delay}`
              : `data-particle-drift-${particle.id}-idle 8s ease-in infinite ${particle.delay}`,
            [`@keyframes data-particle-drift-${particle.id}-active`]: {
              '0%': { transform: 'translateY(0) translateX(0)', opacity: 0 },
              '20%': { opacity: 0.8 },
              '80%': { opacity: 1 },
              '100%': { transform: `translateY(-220px) translateX(${particle.endTranslateX})`, opacity: 0 },
            },
            [`@keyframes data-particle-drift-${particle.id}-idle`]: {
              '0%': { transform: 'translateY(0) translateX(0)', opacity: 0 },
              '20%': { opacity: 0.3 },
              '80%': { opacity: 0.5 },
              '100%': { transform: `translateY(-220px) translateX(${particle.endTranslateX})`, opacity: 0 },
            }
          }}
        />
      ))}

      {/* Peripheral Glass Rings (Shockwave Effect) */}
      {[1, 2].map((ring) => (
        <Box
          key={`glass-ring-${ring}`}
          sx={{
            position: 'absolute',
            width: 140,
            height: 140,
            borderRadius: '50%',
            border: isAwaitingInput ? '1px solid rgba(255,179,0,0.3)' : '1px solid rgba(0,191,165,0.3)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 0,
            opacity: 0,
            animation: isActive || isAwaitingInput
              ? `glass-shockwave-${ring} 2s cubic-bezier(0.25, 1, 0.5, 1) infinite ${ring === 1 ? '0s' : '1s'}`
              : 'none',
            '@keyframes glass-shockwave-1': {
              '0%': { transform: 'scale(1)', opacity: 0.8 },
              '100%': { transform: 'scale(2.5)', opacity: 0 },
            },
            '@keyframes glass-shockwave-2': {
              '0%': { transform: 'scale(1)', opacity: 0.6 },
              '100%': { transform: 'scale(3.0)', opacity: 0 },
            }
          }}
        />
      ))}

      {/* Shadow Pedestal */}
      <Box
        sx={{
          position: 'absolute',
          bottom: '18%',
          width: 100,
          height: 12,
          borderRadius: '50%',
          background: isAwaitingInput ? 'rgba(80, 50, 0, 0.3)' : 'rgba(0, 50, 20, 0.3)',
          filter: 'blur(6px)',
          zIndex: 0,
          animation: isActive || isAwaitingInput
            ? 'shadow-pulse-active 2s ease-in-out infinite alternate'
            : 'shadow-pulse-idle 6s ease-in-out infinite alternate',
          '@keyframes shadow-pulse-active': {
            '0%': { transform: 'scale(1.1)', opacity: 0.3 },
            '33%': { transform: 'scale(0.9)', opacity: 0.6 },
            '66%': { transform: 'scale(1.15)', opacity: 0.2 },
            '100%': { transform: 'scale(0.9)', opacity: 0.6 },
          },
          '@keyframes shadow-pulse-idle': {
            '0%': { transform: 'scale(1.05)', opacity: 0.3 },
            '50%': { transform: 'scale(0.95)', opacity: 0.5 },
            '100%': { transform: 'scale(1.05)', opacity: 0.3 },
          }
        }}
      />
      
      {/* Pure Liquid Intelligence Orb */}
      <Box
        sx={{
          position: 'absolute',
          width: 140,
          height: 140,
          // Performance optimization: Removed border-radius morphing which causes expensive layout recalculations.
          // Now relies on purely GPU-accelerated transforms for the "liquid" feel.
          animation: isActive || isThinking || isAwaitingInput
            ? 'liquid-bulge-active 2s ease-in-out infinite alternate, liquid-rotate 4s linear infinite'
            : 'liquid-bulge-idle 6s ease-in-out infinite alternate, liquid-rotate 12s linear infinite',
          background: isAwaitingInput
            ? 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9) 0%, rgba(255,179,0,0.5) 40%, rgba(255,179,0,0.2) 100%)'
            : 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9) 0%, rgba(0,158,37,0.5) 40%, rgba(0,158,37,0.2) 100%)',
          boxShadow: isAwaitingInput
            ? 'inset 0 0 20px rgba(255,179,0,0.6), 0 0 30px 5px rgba(255,179,0,0.3)'
            : 'inset 0 0 20px rgba(0,158,37,0.6), 0 0 30px 5px rgba(0,158,37,0.3)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          WebkitMaskImage: '-webkit-radial-gradient(white, black)', // Fix for Safari/Chrome overflow:hidden with blur
          zIndex: 1,
          borderRadius: '50%', // Keep it a static circle for performance
          transition: 'background 0.5s ease, box-shadow 0.5s ease',
          
          '@keyframes liquid-rotate': {
            '0%': { transform: 'rotate(0deg)' },
            '100%': { transform: 'rotate(360deg)' },
          },
          // Active: Vertical hover bounce
          '@keyframes liquid-bulge-active': {
            '0%': { transform: 'scale(1.02) translateY(-4px)' },
            '33%': { transform: 'scale(1.01) translateY(2px)' },
            '66%': { transform: 'scale(1.03) translateY(-6px)' },
            '100%': { transform: 'scale(1.01) translateY(2px)' },
          },
          // Recoil: Snap back when interrupted
          '@keyframes liquid-recoil': {
            '0%': { transform: 'scale(1.2)', filter: 'brightness(1.5)' },
            '100%': { transform: 'scale(1)', filter: 'brightness(1)' },
          },
          // Idle: Barely noticeable hover
          '@keyframes liquid-bulge-idle': {
            '0%': { transform: 'translateY(-3px)' },
            '50%': { transform: 'translateY(3px)' },
            '100%': { transform: 'translateY(-3px)' },
          }
        }}
      >
        {/* Recoil Overlay */}
        {isInterrupted && (
          <Box sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 70%)',
            animation: 'liquid-recoil 0.4s cubic-bezier(0.19, 1, 0.22, 1) forwards',
          }} />
        )}
        {/* Inner Swirling Liquid Colors */}
        <Box
          sx={{
            position: 'absolute',
            width: '150%',
            height: '150%',
            borderRadius: '50%', // Ensures the blur doesn't create square corners
            background: isAwaitingInput
              ? 'conic-gradient(from 0deg at 50% 50%, rgba(255,179,0,0.7) 0%, rgba(255,215,0,0.4) 25%, rgba(255,179,0,0.1) 50%, rgba(255,215,0,0.6) 75%, rgba(255,179,0,0.7) 100%)'
              : 'conic-gradient(from 0deg at 50% 50%, rgba(0,158,37,0.7) 0%, rgba(0,191,165,0.4) 25%, rgba(0,158,37,0.1) 50%, rgba(0,191,165,0.6) 75%, rgba(0,158,37,0.7) 100%)',
            animation: isActive || isThinking || isAwaitingInput ? 'inner-swirl-active 1.5s linear infinite' : 'inner-swirl-idle 10s linear infinite',
            '@keyframes inner-swirl-idle': {
              '0%': { transform: 'rotate(0deg) scale(1)' },
              '100%': { transform: 'rotate(-360deg) scale(1)' },
            },
            '@keyframes inner-swirl-active': {
              '0%': { transform: 'rotate(0deg) scale(1.2)' },
              '50%': { transform: 'rotate(-180deg) scale(0.8)' },
              '100%': { transform: 'rotate(-360deg) scale(1.2)' },
            },
            filter: 'blur(12px)',
            zIndex: 0,
            transition: 'background 0.5s ease',
          }}
        />

        {/* Dynamic Core Light - Reacts to speech or thinking */}
        <Box
          sx={{
            position: 'absolute',
            width: '60%',
            height: '60%',
            borderRadius: '50%',
            background: isThinking 
              ? 'radial-gradient(circle, rgba(0,150,255,0.8) 0%, rgba(0,150,255,0) 70%)' 
              : isAwaitingInput
                ? 'radial-gradient(circle, rgba(255,215,0,0.8) 0%, rgba(255,215,0,0) 70%)'
                : 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)',
            animation: isThinking 
              ? 'core-pulse-thinking 2s ease-in-out infinite alternate' 
              : isActive || isAwaitingInput
                ? 'core-pulse-active 0.5s ease-in-out infinite alternate' 
                : 'core-pulse-idle 4s ease-in-out infinite alternate',
            '@keyframes core-pulse-active': {
              '0%': { transform: 'scale(0.8)', opacity: 0.5 },
              '100%': { transform: 'scale(1.5)', opacity: 1 },
            },
            '@keyframes core-pulse-thinking': {
              '0%': { transform: 'scale(0.9)', opacity: 0.6 },
              '100%': { transform: 'scale(1.2)', opacity: 0.9 },
            },
            '@keyframes core-pulse-idle': {
              '0%': { transform: 'scale(0.9)', opacity: 0.1 },
              '100%': { transform: 'scale(1.1)', opacity: 0.3 },
            },
            filter: 'blur(8px)',
            zIndex: 1,
            transition: 'background 0.5s ease',
          }}
        />

        {/* Liquid Highlight to enhance 3D volume */}
        <Box
          sx={{
            position: 'absolute',
            top: '15%',
            left: '15%',
            width: '40%',
            height: '40%',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 60%)',
            filter: 'blur(4px)',
            zIndex: 2,
            animation: isActive || isAwaitingInput ? 'highlight-move-active 2s ease-in-out infinite alternate' : 'highlight-move-idle 6s ease-in-out infinite alternate',
            '@keyframes highlight-move-active': {
              '0%': { transform: 'translate(0, 0) scale(1)' },
              '100%': { transform: 'translate(10px, 10px) scale(1.15)' },
            },
            '@keyframes highlight-move-idle': {
              '0%': { transform: 'translate(0, 0) scale(1)' },
              '100%': { transform: 'translate(5px, 5px) scale(1.05)' },
            }
          }}
        />
      </Box>
    </Box>
  )
}
