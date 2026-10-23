const youtubeVideos = [
  'z9_BcTwq41c',
  '59x7LAQL5VQ',
  'RqvzQ2vQZOg',
  '1AwL9FZ4ScI',
  'BPbdnb9kL-8',
];

export default function PlacementRelatedVideos() {
  const [featured, ...suggested] = youtubeVideos;

  return <aside className="placement-related" aria-labelledby="placement-related-title">
    <h3 id="placement-related-title">Related Videos</h3>
    <a className="placement-related-featured" href={`https://www.youtube.com/watch?v=${featured}`} target="_blank" rel="noopener noreferrer" aria-label="Watch featured related video on YouTube">
      <img src={`https://i.ytimg.com/vi/${featured}/hqdefault.jpg`} alt="" loading="lazy" width="480" height="360" />
      <span aria-hidden="true">▶</span>
    </a>
    <h4>More to watch</h4>
    <div className="placement-related-list">
      {suggested.map((id, index) => <a
        className="placement-related-card"
        href={`https://www.youtube.com/watch?v=${id}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open suggested video ${index + 1} on YouTube`}
        key={id}
      >
        <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" width="240" height="135" />
        <span aria-hidden="true">▶</span>
      </a>)}
    </div>
  </aside>;
}
