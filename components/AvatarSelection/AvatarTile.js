/* eslint-disable @next/next/no-img-element */
import React from 'react'

export default function AvatarTile({ avatarType, config, onSelect, index }) {
  // Define gradient backgrounds for each avatar
  const gradientStyles = {
    'computer-teacher': 'bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700',
    'english-teacher': 'bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700',
    'biology-teacher': 'bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700',
    'physics-teacher': 'bg-gradient-to-br from-yellow-500 via-orange-600 to-red-600',
    'chemistry-teacher': 'bg-gradient-to-br from-purple-500 via-pink-600 to-rose-700',
    'history-teacher': 'bg-gradient-to-br from-amber-500 via-orange-600 to-red-700',
    'geography-teacher': 'bg-gradient-to-br from-blue-500 via-cyan-600 to-teal-700',
    'hindi-teacher': 'bg-gradient-to-br from-orange-500 via-red-600 to-pink-700',
    'mathematics-teacher': 'bg-gradient-to-br from-indigo-500 via-purple-600 to-violet-700',
    'doctor': 'bg-gradient-to-br from-red-500 via-pink-600 to-rose-700',
    'engineer': 'bg-gradient-to-br from-gray-600 via-slate-700 to-zinc-800',
    'lawyer': 'bg-gradient-to-br from-slate-600 via-gray-700 to-zinc-800'
  }

  const handleClick = () => {
    onSelect(avatarType)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  return (
    <div
      className={`${gradientStyles[avatarType]} rounded-xl p-4 cursor-pointer text-center text-white transform transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-2xl backdrop-blur-sm border border-white/20`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      style={{
        animationDelay: `${index * 100}ms`
      }}
    >
      <div className="avatar-image-container mb-3 relative">
        <img
          src={config.image}
          alt={config.name}
          className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover mx-auto border-2 border-white/30 shadow-lg transition-all duration-300"
          onError={(e) => {
            e.target.style.display = 'none'
            e.target.nextElementSibling.style.display = 'block'
          }}
        />
        <div className="text-3xl md:text-4xl" style={{display: 'none'}}>
          {config.emoji}
        </div>
        
        {/* Logo Badge */}
        <div className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 bg-white/90 backdrop-blur-sm rounded-full p-1 md:p-1.5 shadow-lg border border-white/50">
          <div className="text-lg md:text-xl">
            {config.emoji}
          </div>
        </div>
      </div>
      
      <h3 className="text-sm md:text-base font-semibold mb-1 leading-tight">
        {config.name}
      </h3>
      <p className="text-white/80 text-xs md:text-sm leading-tight px-1">
        {config.domain}
      </p>
    </div>
  )
}
