/* eslint-disable @next/next/no-img-element */
const YouTubeVideos = ({ videos = [], title = "Related Videos" }) => {
  if (!videos || videos.length === 0) {
    return null
  }

  return (
    <div className="mb-6">
      <div className="flex items-center mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="23,7 16,12 23,17 23,7"/>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          </svg>
          {title}
        </h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video, index) => (
          <div
            key={index}
            className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 hover:border-white/20 transition-all duration-200 hover:scale-105"
          >
            <div className="relative">
              <div className="w-full h-32 rounded-t-lg overflow-hidden">
                {video.thumbnailUrl ? (
                  <img 
                    src={video.thumbnailUrl} 
                    alt={video.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'flex'
                    }}
                  />
                ) : null}
                <div className={`w-full h-full ${video.thumbnailUrl ? 'hidden' : 'flex'} items-center justify-center bg-gradient-to-br from-red-500/20 to-red-600/20`}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-white/60">
                    <polygon points="23,7 16,12 23,17 23,7"/>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-red-500/80 rounded-full flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-white ml-1">
                    <polygon points="5,3 19,12 5,21"/>
                  </svg>
                </div>
              </div>
            </div>
            <div className="p-4">
              <h4 className="text-white font-medium text-sm mb-2 line-clamp-2 break-words overflow-wrap-anywhere">
                {video.title}
              </h4>
              <p className="text-white/60 text-xs mb-3 line-clamp-2 break-words overflow-wrap-anywhere">
                {video.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-white/40 text-xs">
                  {video.duration}
                </span>
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-red-400 hover:text-red-300 text-xs font-medium transition-colors"
                >
                  Watch Video
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 7h10v10"/>
                    <path d="M7 17 17 7"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default YouTubeVideos
