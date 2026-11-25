import { useState } from 'react';
import styles from './CategoryMenu.module.css';

// 접고 펼치는 선택 칸 (브랜드·계절): 하나 또는 전체를 고른다
// title: 칸 이름, allLabel: 전체 선택 이름, options: [{ name, count }], selectedValue: 고른 값('' = 전체), onSelect: 골랐을 때
function OptionSection({ title, allLabel, options, selectedValue, onSelect }) {

    // 펼침 여부 (값을 골라 둔 상태로 들어오면 펼친 상태로 시작한다)
    const [open, setOpen] = useState(selectedValue !== '');

    function getClass(isActive) {
        return isActive ? `${styles.itemButton} ${styles.active}` : styles.itemButton;
    }

    return (
        <div className={styles.category}>
            <div className={styles.groupRow}>
                <button
                    type="button"
                    className={styles.categoryButton}
                    onClick={() => setOpen(!open)}
                    aria-expanded={open}
                >
                    {title}
                </button>
                <button
                    type="button"
                    className={open ? `${styles.toggleButton} ${styles.toggleOpen}` : styles.toggleButton}
                    onClick={() => setOpen(!open)}
                    aria-expanded={open}
                    aria-label={open ? `${title} 접기` : `${title} 펼치기`}
                >
                    ▾
                </button>
            </div>

            {/* 접혀 있어도 고른 값은 보이게 한다 */}
            {!open && selectedValue && (
                <p className={styles.selectedOption}>{selectedValue}</p>
            )}

            {open && (
                <ul className={styles.options}>
                    <li>
                        <button
                            type="button"
                            className={getClass(selectedValue === '')}
                            onClick={() => onSelect('')}
                        >
                            {allLabel}
                        </button>
                    </li>
                    {options.map(option =>
                        <li key={option.name}>
                            <button
                                type="button"
                                className={getClass(selectedValue === option.name)}
                                onClick={() => onSelect(option.name)}
                                aria-pressed={selectedValue === option.name}
                            >
                                {option.name}
                                <span className={styles.optionCount}>{option.count}</span>
                            </button>
                        </li>
                    )}
                </ul>
            )}
        </div>
    );
}

// 카테고리 메뉴 (전체 / 브랜드 / 계절 / 대분류 > 중분류 > 세부 항목)
// categories: 카테고리 목록, selected: 현재 선택 { category, group, item }
// onSelect: 선택했을 때 부모에게 알린다 (선택 상태는 부모가 관리)
// brands·seasons: 목록 [{ name, count }], selectedBrand·selectedSeason: 고른 값('' = 전체)
// onBrandSelect·onSeasonSelect: 골랐을 때 부모에게 알린다
// onReset: 초기화를 눌렀을 때 부모에게 알린다 (브랜드·계절·카테고리·검색어·정렬을 모두 처음 상태로)
// 세부 항목이 있는 중분류(티셔츠, 재킷 등)와 브랜드·계절 목록은 드롭다운으로 접고 펼친다
function CategoryMenu({ categories, selected, onSelect, brands, selectedBrand, onBrandSelect, seasons, selectedSeason, onSeasonSelect, onReset }) {

    // 펼친 중분류 목록 ('상의/티셔츠' 형태). 펼침 여부는 메뉴 안에서만 쓰는 화면 상태다
    // 처음 열 때 선택된 중분류가 있으면 펼친 상태로 시작한다 (새로고침해도 선택 위치가 보이게)
    const [openGroups, setOpenGroups] = useState(() =>
        selected.category && selected.group ? [`${selected.category}/${selected.group}`] : []
    );

    function getClass(isActive, baseClass) {
        return isActive ? `${baseClass} ${styles.active}` : baseClass;
    }

    function getGroupKey(categoryName, groupName) {
        return `${categoryName}/${groupName}`;
    }

    // 펼침 여부는 openGroups만 보고 판단한다 (선택돼 있어도 접을 수 있어야 한다)
    function isOpen(categoryName, groupName) {
        return openGroups.includes(getGroupKey(categoryName, groupName));
    }

    function toggleGroup(categoryName, groupName) {
        const key = getGroupKey(categoryName, groupName);

        if (openGroups.includes(key)) {
            setOpenGroups(openGroups.filter(openKey => openKey !== key));
        } else {
            setOpenGroups([...openGroups, key]);
        }
    }

    // 중분류 이름을 누르면 선택하고, 하위 메뉴가 있으면 펼치거나 접는다
    function handleGroupClick(categoryName, group) {
        if (group.items.length > 0) {
            toggleGroup(categoryName, group.name);
        }

        onSelect({ category: categoryName, group: group.name });
    }

    return (
        <nav className={styles.menu} aria-label="카테고리">
            {/* 왼쪽 전체(카테고리 전체), 오른쪽 초기화(모든 조건을 처음 상태로) */}
            <div className={styles.allRow}>
                <button
                    type="button"
                    className={getClass(!selected.category, styles.allButton)}
                    onClick={() => onSelect({})}
                >
                    전체
                </button>
                <button type="button" className={styles.resetButton} onClick={onReset}>
                    초기화
                </button>
            </div>

            {/* 브랜드·계절: 한 개 또는 전체를 고른다. 카테고리와 함께 적용된다 (F-03) */}
            <OptionSection
                title="브랜드"
                allLabel="전체 브랜드"
                options={brands}
                selectedValue={selectedBrand}
                onSelect={onBrandSelect}
            />
            <OptionSection
                title="계절"
                allLabel="전체 계절"
                options={seasons}
                selectedValue={selectedSeason}
                onSelect={onSeasonSelect}
            />

            {categories.map(category =>
                <div key={category.name} className={styles.category}>
                    <button
                        type="button"
                        className={getClass(selected.category === category.name && !selected.group, styles.categoryButton)}
                        onClick={() => onSelect({ category: category.name })}
                    >
                        {category.name}
                    </button>

                    {category.groups.map(group => {
                        const hasItems = group.items.length > 0;
                        const open = hasItems && isOpen(category.name, group.name);

                        return (
                            <div key={group.name} className={styles.group}>
                                <div className={styles.groupRow}>
                                    <button
                                        type="button"
                                        className={getClass(selected.category === category.name && selected.group === group.name && !selected.item, styles.groupButton)}
                                        onClick={() => handleGroupClick(category.name, group)}
                                    >
                                        {group.name}
                                    </button>

                                    {/* 하위 메뉴가 있을 때만 펼치기 화살표를 보여 준다 */}
                                    {hasItems && (
                                        <button
                                            type="button"
                                            className={open ? `${styles.toggleButton} ${styles.toggleOpen}` : styles.toggleButton}
                                            onClick={() => toggleGroup(category.name, group.name)}
                                            aria-expanded={open}
                                            aria-label={open ? `${group.name} 접기` : `${group.name} 펼치기`}
                                        >
                                            ▾
                                        </button>
                                    )}
                                </div>

                                {open && (
                                    <ul className={styles.items}>
                                        {group.items.map(item =>
                                            <li key={item}>
                                                <button
                                                    type="button"
                                                    className={getClass(selected.category === category.name && selected.group === group.name && selected.item === item, styles.itemButton)}
                                                    onClick={() => onSelect({ category: category.name, group: group.name, item })}
                                                >
                                                    {item}
                                                </button>
                                            </li>
                                        )}
                                    </ul>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </nav>
    );
}

export default CategoryMenu;
