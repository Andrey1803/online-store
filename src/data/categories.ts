export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  parentId?: string;
}

export const defaultCategories: Category[] = [
  {
    id: 'nasosy',
    slug: 'nasosy',
    name: 'Бытовые насосы',
    description: 'Скважинные, дренажные, фекальные, поверхностные и станции',
    icon: '⚙️',
  },
  { id: 'skvazhinnye', slug: 'skvazhinnye', name: 'Скважинные насосы', description: 'Погружные насосы для скважин', icon: '🔩', parentId: 'nasosy' },
  { id: 'stantsii', slug: 'stantsii', name: 'Насосные станции', description: 'Готовые станции водоснабжения', icon: '🏠', parentId: 'nasosy' },
  { id: 'fekalnye', slug: 'fekalnye', name: 'Фекальные насосы', description: 'Для канализации и стоков', icon: '🚿', parentId: 'nasosy' },
  { id: 'drenazhnye', slug: 'drenazhnye', name: 'Дренажные насосы', description: 'Откачка воды из подвалов и котлованов', icon: '💧', parentId: 'nasosy' },
  { id: 'poverkhnostnye', slug: 'poverkhnostnye', name: 'Поверхностные насосы', description: 'Самовсасывающие и центробежные', icon: '🌊', parentId: 'nasosy' },
  { id: 'tsirkulyarnye', slug: 'tsirkulyarnye', name: 'Циркуляционные насосы', description: 'Для отопления и ГВС', icon: '♻️', parentId: 'nasosy' },
  {
    id: 'avtomatika',
    slug: 'avtomatika',
    name: 'Автоматика для насосов',
    description: 'Реле давления, частотники, блоки управления',
    icon: '📟',
  },
  {
    id: 'baki',
    slug: 'baki',
    name: 'Мембранные баки',
    description: 'Гидроаккумуляторы и расширительные баки',
    icon: '🛢️',
  },
  {
    id: 'filtry',
    slug: 'filtry',
    name: 'Фильтры и картриджи',
    description: 'Очистка воды, осмос, грязевики',
    icon: '🔬',
  },
  {
    id: 'komplektuyushchie',
    slug: 'komplektuyushchie',
    name: 'Комплектующие',
    description: 'Адаптеры, трос, клапана, фитинги для скважин',
    icon: '🔧',
  },
  {
    id: 'truby',
    slug: 'truby',
    name: 'Трубы водоснабжения',
    description: 'Питьевые и канализационные трубы',
    icon: '📏',
  },
  {
    id: 'shlangi',
    slug: 'shlangi',
    name: 'Шланги',
    description: 'Поливочные, дренажные, всасывающие',
    icon: '〰️',
  },
  {
    id: 'otoplenie',
    slug: 'otoplenie',
    name: 'Отопительное оборудование',
    description: 'Котлы, тепловентиляторы, радиаторы',
    icon: '🔥',
  },
  {
    id: 'vodonagrevateli',
    slug: 'vodonagrevateli',
    name: 'Водонагреватели',
    description: 'Электрические и газовые',
    icon: '🌡️',
  },
  {
    id: 'polipropilen',
    slug: 'polipropilen',
    name: 'Полипропилен',
    description: 'Трубы и фитинги PPR',
    icon: '🔗',
  },
  {
    id: 'promyshlennye',
    slug: 'promyshlennye',
    name: 'Промышленные насосы',
    description: 'Многоступенчатые, мотопомпы, центробежные',
    icon: '🏭',
  },
  {
    id: 'teplyy-pol',
    slug: 'teplyy-pol',
    name: 'Тёплый пол',
    description: 'Трубы, коллекторы, крепления',
    icon: '♨️',
  },
  {
    id: 'kessony',
    slug: 'kessony',
    name: 'Кессоны и септики',
    description: 'Пластиковые кессоны и септики',
    icon: '🕳️',
  },
  {
    id: 'zapchasti',
    slug: 'zapchasti',
    name: 'Запасные части',
    description: 'Крыльчатки, сальники, двигатели',
    icon: '⚡',
  },
];

/** @deprecated используйте defaultCategories */
export const categories = defaultCategories;
