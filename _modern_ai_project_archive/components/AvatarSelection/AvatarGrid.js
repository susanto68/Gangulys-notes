import React from 'react'
import AvatarTile from './AvatarTile'

export default function AvatarGrid({ avatars, onAvatarSelect }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto">
      {Object.entries(avatars).map(([key, config], index) => (
        <AvatarTile
          key={key}
          avatarType={key}
          config={config}
          onSelect={onAvatarSelect}
          index={index}
        />
      ))}
    </div>
  )
}
