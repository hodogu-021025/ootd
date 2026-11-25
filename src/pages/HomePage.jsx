import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import homeTitle from '../image/home_title.webp';
import ootdLogo from '../image/ootd_logo.webp';
import ootdName from '../image/ootd_name.webp';
import menTitle from '../image/men_title.webp';
import womenTitle from '../image/women_title.webp';
import unisexTitle from '../image/unisex_title.webp';
import model01 from '../image/model01.webp';
import model02 from '../image/model02.webp';
import model03 from '../image/model03.webp';
import model01Profile from '../image/model01_profile.webp';
import model02Profile from '../image/model02_profile.webp';
import model03Profile from '../image/model03_profile.webp';
import styles from './HomePage.module.css';

// 히어로가 완전히 사라지는 스크롤 위치(px)
const HERO_FADE_DISTANCE = 600;

// 흘러가는 띠에 표시할 의류 종류
const CLOTHING_TYPES = 'T-SHIRT · SHIRT · KNIT · SWEATSHIRT · HOODIE · JACKET · COAT · PADDING · JEANS · SLACKS · SHORTS · DRESS · SKIRT · ';

// 넓은 화면에서도 빈 공간이 보이지 않도록 목록을 여러 번 이어 붙인다
const MARQUEE_TEXT = CLOTHING_TYPES.repeat(3);

// 오늘의 코디 데이터
// outfit의 name에 착용한 옷 정보를 입력한다. 비어 있으면 '정보 준비 중'으로 표시된다.
// productId를 적으면 그 항목을 눌렀을 때 해당 의류 상세(/products/번호)로 이동한다.
// 같은 종류를 여러 개 입었으면 같은 category로 여러 줄을 적는다 (예: 악세사리 2개)
const OOTD_LOOKS = [
    {
        image: model01,
        profile: model01Profile,
        name: 'yena_',
        tags: '#벚꽃 #핑쿠핑쿠 #봄옷',
        text: '벚꽃과 어울리는 핑크 코디',
        outfit: [
            { category: '아우터', name: '슬림 롱 슬리브 코튼 가디건', productId: 2 },
            { category: '상의', name: '빈티지 리본 레이스 탑', productId: 1 },
            { category: '하의', name: '엔트리 맘핏 데님 아이보리', productId: 102 },
            { category: '악세사리', name: '실버 레더 숄더백', productId: 99 }
        ]
    },
    {
        image: model02,
        profile: model02Profile,
        name: 'min_hyuk',
        tags: '#가을 #가을남자',
        text: '가을 타는 느좋남 코디',
        outfit: [
            { category: '상의', name: '오버사이즈 린넨 혼방 긴팔 셔츠', productId: 23 },
            { category: '하의', name: '세미와이드 투턱 슬랙스', productId: 100 },
            { category: '악세사리', name: '클래식 블랙 레더 벨트', productId: 24 },
            { category: '악세사리', name: '라운드 메탈 프레임 안경', productId: 42 }
        ]
    },
    {
        image: model03,
        profile: model03Profile,
        name: 'k_min',
        tags: '#여름 #여름엔아아',
        text: '아아와 함께하는 여름 코디',
        outfit: [
            { category: '상의', name: '빈티지 리본 레이스 탑', productId: 1 },
            { category: '하의', name: '사이드 핀턱 와이드 데님 팬츠', productId: 101 },
            { category: '악세사리', name: '블랙 오벌 프레임 선글라스', productId: 41 }
        ]
    }
];

// 오늘의 코디 카드 (SNS 게시물 형태)
function OotdCard({ image, profile, name, tags, text, outfit }) {

    // 하트를 눌렀는지 여부 (누르면 좋아요 수가 1 오른다)
    const [liked, setLiked] = useState(false);
    const likeCount = liked ? 1 : 0;

    function handleLikeClick() {
        setLiked(!liked);
    }

    // 같은 종류가 이어지면 한 줄로 묶는다 (종류 이름은 한 번만, 제품명은 아래로 차례로)
    // 예: 악세사리 벨트, 악세사리 안경 → 악세사리 [벨트, 안경]
    const outfitGroups = [];

    outfit.forEach(item => {
        const lastGroup = outfitGroups[outfitGroups.length - 1];

        if (lastGroup && lastGroup.category === item.category) {
            lastGroup.items.push(item);
        } else {
            outfitGroups.push({ category: item.category, items: [item] });
        }
    });

    return (
        <article className={styles.card}>
            <div className={styles.cardHeader}>
                <img src={profile} alt="" className={styles.cardAvatar} />
                <span className={styles.cardName}>{name}</span>
            </div>

            {/* 사진 위에 옷 정보 목록을 겹친다 (사진 자체는 누르지 않는다) */}
            <div className={styles.cardMedia}>
                <img src={image} alt="" className={styles.cardImage} />

                {/* 커서를 올리면 사진 위에 착용한 옷 정보가 나타난다 */}
                <div className={styles.outfitOverlay}>
                    <ul className={styles.outfitList}>
                        {/* 같은 종류가 떨어져서 두 번 나올 수도 있어 순서를 함께 key로 쓴다 */}
                        {outfitGroups.map((group, groupIndex) =>
                            <li key={`${groupIndex}-${group.category}`} className={styles.outfitItem}>
                                <span className={styles.outfitCategory}>{group.category}</span>

                                <div className={styles.outfitNames}>
                                    {group.items.map((item, itemIndex) =>
                                        // 연결된 의류가 있으면 누를 때 그 의류 상세로 이동한다
                                        item.productId
                                            ? <Link key={itemIndex} to={`/products/${item.productId}`} className={styles.outfitLink}>{item.name}</Link>
                                            : <span key={itemIndex}>{item.name || '정보 준비 중'}</span>
                                    )}
                                </div>
                            </li>
                        )}
                    </ul>
                </div>
            </div>

            <div className={styles.cardFooter}>
                {/* 왼쪽: 하트와 좋아요 수(세로), 오른쪽: 해시태그와 글(같은 시작 위치) */}
                <div className={styles.cardBody}>
                    <button
                        type="button"
                        className={styles.likeButton}
                        onClick={handleLikeClick}
                        aria-pressed={liked}
                        aria-label={liked ? '좋아요 취소' : '좋아요'}
                    >
                        <svg
                            className={liked ? `${styles.heart} ${styles.heartLiked}` : styles.heart}
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path d="M12 21s-7.5-4.7-9.4-9A5.2 5.2 0 0 1 12 6.2 5.2 5.2 0 0 1 21.4 12c-1.9 4.3-9.4 9-9.4 9z" />
                        </svg>
                        <span className={styles.likeCount}>{likeCount}</span>
                    </button>

                    <div className={styles.cardInfo}>
                        <p className={styles.cardTags}>{tags}</p>
                        <p className={styles.cardText}>{text}</p>
                    </div>
                </div>
            </div>
        </article>
    );
}

function HomePage() {

    // 현재 스크롤 위치
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {

        function handleScroll() {
            setScrollY(window.scrollY);
        }

        window.addEventListener('scroll', handleScroll);

        // 화면을 떠날 때 이벤트 정리
        return () => window.removeEventListener('scroll', handleScroll);

    }, []);

    // 스크롤을 내릴수록 0에 가까워진다 (1 → 0)
    const heroRatio = Math.max(0, 1 - scrollY / HERO_FADE_DISTANCE);

    // 고정된 자리에서 흐려진다 (위로 밀어 올리면 빈 공간이 생김)
    const heroStyle = {
        opacity: heroRatio
    };

    // 확대는 사진에만 적용해 히어로 틀(overflow: hidden) 안에서 잘리게 한다
    // (히어로 전체를 확대하면 화면 밖으로 넘쳐 가로 스크롤이 생김)
    const heroImageStyle = {
        transform: `scale(${1 + (1 - heroRatio) * 0.05})`
    };

    return (
        <div>
            {/* 히어로 표지: 제자리에 고정된 채 흐려지고, 아래 내용이 그 위를 덮으며 올라온다 */}
            <div className={styles.heroWrap}>
                <section className={styles.hero} style={heroStyle}>
                    <img src={homeTitle} alt="" className={styles.heroImage} style={heroImageStyle} />

                    <div className={styles.heroText}>
                        <img src={ootdLogo} alt="" className={styles.heroLogo} />
                        <h2 className={styles.heroTitle}>
                            <img src={ootdName} alt="OOTD" className={styles.heroNameImage} />
                        </h2>
                        <p className={styles.heroDescription}>오늘의 옷차림을 완성하는 의류 쇼핑몰</p>
                    </div>
                </section>
            </div>

            {/* 히어로 위를 덮으며 올라오는 내용 */}
            <div className={styles.contents}>

            {/* 성별 구분 배너 3개 */}
            <section className="container">
                <h3 className={styles.sectionTitle}>Your OOTD</h3>

                <div className={styles.banners}>
                    <Link to="/products?gender=men" className={styles.banner}>
                        <img src={menTitle} alt="" className={styles.bannerImage} />
                        <span className={styles.bannerLabel}>MEN</span>
                    </Link>

                    <Link to="/products?gender=women" className={styles.banner}>
                        <img src={womenTitle} alt="" className={styles.bannerImage} />
                        <span className={styles.bannerLabel}>WOMEN</span>
                    </Link>

                    <Link to="/products?gender=unisex" className={styles.banner}>
                        <img src={unisexTitle} alt="" className={styles.bannerImage} />
                        <span className={styles.bannerLabel}>UNISEX</span>
                    </Link>
                </div>

                {/* 제목과 같은 가로줄로 영역을 마무리한다 */}
                <div className={styles.divider}></div>
            </section>

            {/* 의류 종류가 흘러가는 띠 */}
            <div className={styles.marquee}>
                {/* 같은 내용을 두 번 넣어 끊김 없이 이어지게 한다 */}
                <div className={styles.marqueeTrack}>
                    <span className={styles.marqueeText}>{MARQUEE_TEXT}</span>
                    <span className={styles.marqueeText}>{MARQUEE_TEXT}</span>
                </div>
            </div>

            {/* 오늘의 코디 */}
            <section className="container">
                <h3 className={styles.sectionTitle}>Today&apos;s OOTD</h3>

                <div className={`${styles.banners} ${styles.looks}`}>
                    {OOTD_LOOKS.map(look =>
                        <OotdCard
                            key={look.name}
                            image={look.image}
                            profile={look.profile}
                            name={look.name}
                            tags={look.tags}
                            text={look.text}
                            outfit={look.outfit}
                        />
                    )}
                </div>

                {/* 제목과 같은 가로줄로 영역을 마무리한다 */}
                <div className={styles.divider}></div>
            </section>

            </div>
        </div>
    );
}

export default HomePage;
