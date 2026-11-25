import { Link } from 'react-router-dom';
import styles from './Breadcrumb.module.css';

// 현재 위치 표시 (예: HOME › MEN)
// items: [{ label: 'HOME', to: '/' }, { label: 'MEN' }] 마지막 항목은 현재 위치라 링크가 없다
function Breadcrumb({ items }) {

    return (
        <nav className={styles.breadcrumb} aria-label="현재 위치">
            <ol className={styles.list}>
                {items.map((item, index) =>
                    // 같은 이름이 두 번 나올 수 있어(예: 패딩 › 패딩) 순서를 함께 key로 쓴다
                    <li key={`${index}-${item.label}`} className={styles.item}>
                        {index > 0 && <span className={styles.separator} aria-hidden="true">›</span>}

                        {item.to
                            ? <Link to={item.to} className={styles.link}>{item.label}</Link>
                            : <span className={styles.current} aria-current="page">{item.label}</span>
                        }
                    </li>
                )}
            </ol>
        </nav>
    );
}

export default Breadcrumb;
