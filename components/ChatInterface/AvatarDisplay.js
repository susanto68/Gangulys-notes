export default function AvatarDisplay({ avatar, config, isSpeaking }) {
  return (
    <div className="text-center">
      <div className="relative inline-block">
        <div className={`relative p-6 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 transition-all duration-300 ${isSpeaking ? 'scale-105' : ''}`}>
          <img
            src={config.image}
            alt={config.name}
            className={`w-24 h-24 md:w-32 md:h-32 rounded-full object-cover mx-auto border-4 border-white/40 shadow-2xl transition-all duration-300 ${isSpeaking ? 'animate-pulse' : ''}`}
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextElementSibling.style.display = 'block'
            }}
          />
          <div className={`text-6xl md:text-8xl ${isSpeaking ? 'animate-pulse' : ''}`} style={{display: 'none'}}>
            {config.emoji}
          </div>
          
          {/* Emoji Badge */}
          <div className={`absolute -bottom-2 -right-2 md:-bottom-3 md:-right-3 bg-white/90 backdrop-blur-sm rounded-full p-2 md:p-3 shadow-lg border border-white/50 transition-all duration-300 ${isSpeaking ? 'scale-110' : ''}`}>
            <div className="text-xl md:text-2xl">
              {config.emoji}
            </div>
          </div>
        </div>
        
        {/* Speaking indicator */}
        {isSpeaking && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full animate-ping"></div>
        )}
      </div>
      
      <div className="mt-4 text-white/80">
        <p className="font-medium text-lg">{config.name}</p>
        <p className="text-sm opacity-75">{config.domain}</p>
      </div>
    </div>
  )
}
