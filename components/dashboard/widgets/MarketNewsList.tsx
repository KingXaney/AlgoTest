import {formatTimeAgo} from "@/lib/utils";

const NEWS_COUNT = 4;

const MarketNewsList = ({news}: {news: MarketNewsArticle[]}) => {
    if (news.length === 0) {
        return <p className="text-sm text-fg-muted">No recent news available right now.</p>;
    }
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {news.slice(0, NEWS_COUNT).map((article) => (
                <a key={article.id} href={article.url} target="_blank" rel="noopener noreferrer" className="news-item flex flex-col">
                    <span className="news-tag">{article.related || article.source}</span>
                    <h3 className="news-title">{article.headline}</h3>
                    <p className="news-meta">{formatTimeAgo(article.datetime)} · {article.source}</p>
                    <p className="news-summary">{article.summary}</p>
                    <span className="news-cta mt-auto">Read more →</span>
                </a>
            ))}
        </div>
    );
};

export default MarketNewsList;
