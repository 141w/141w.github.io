interface TagsProps {
  tags: string[]
  /** 卡片上只显示前 3 个，详情页显示全部 */
  limit?: number
}

export default function Tags({ tags, limit }: TagsProps) {
  const list = limit ? tags.slice(0, limit) : tags
  return (
    <div className="tags">
      {list.map(tag => (
        <span className="tag" key={tag}>
          {tag}
        </span>
      ))}
    </div>
  )
}
