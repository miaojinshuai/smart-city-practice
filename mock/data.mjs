// mock/data.mjs —— 智慧城市练习平台种子数据（22 个业务模块）
import { IMGS } from './images.mjs';

// 标签 → 本地图片分类（图片来自网络检索，已下载至 public/img）
const LABEL_CAT = {
  城市轮播: 'city', 城市资讯: 'news', 区域: 'city', 服务: 'city', 积分商品: 'city', 等级: 'city', 缴费分类: 'city',
  停车场: 'park',
  地铁城市: 'metro',
  菜品: 'food', 外卖主题: 'food', 评价: 'food',
  外卖商家: 'seller',
  电影海报: 'movie', 影院: 'poster',
  活动: 'activity', 活动分类: 'activity', 志愿资讯: 'activity', 志愿活动: 'activity',
  房源: 'house',
  违章抓拍: 'traffic',
  医院: 'hospital', 医院横幅: 'hospital',
  图书: 'library',
  宠物: 'pet', 问诊图片: 'pet',
  物流公司: 'logistics',
  企业: 'office',
  法律专长: 'law', 咨询图片: 'law',
  公益活动: 'welfare', 公益分类: 'welfare',
  青年驿站: 'youth',
  诉求: 'news', 诉求分类: 'news', 失物: 'news',
};

const h32 = (s) => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 99991, 7);
const svgURI = (s) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s.replace(/\s{2,}/g, ' '));

// 未匹配到实拍图的分类，用内联 SVG 封面兜底（静态托管同样可用）
const COVER_TONES = [['#0ea5e9', '#1e3a8a'], ['#22d3ee', '#0f766e'], ['#818cf8', '#3730a3'], ['#38bdf8', '#1e40af'], ['#34d399', '#065f46']];
const IMG = (t, i = 1, w = 480, h = 360) => {
  const arr = IMGS[LABEL_CAT[t]] || [];
  if (arr.length) return arr[h32(t + '#' + i) % arr.length];
  const [c1, c2] = COVER_TONES[h32(t) % COVER_TONES.length];
  const label = String(t).slice(0, 10);
  return svgURI(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
    <rect width="${w}" height="${h}" fill="url(#g)"/>
    <circle cx="${w * 0.8}" cy="${h * 0.2}" r="${Math.min(w, h) * 0.28}" fill="#fff" fill-opacity="0.12"/>
    <text x="${w / 2}" y="${h / 2 + 8}" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="${Math.round(Math.min(w, h) * 0.13)}"
      fill="#fff" fill-opacity="0.92" text-anchor="middle" font-weight="600">${label}</text></svg>`);
};

// 头像：内联 SVG 字母头像，无需服务端
export const AV = (n) => {
  const hues = [190, 210, 260, 160, 30, 340];
  const hue = hues[h32(String(n)) % hues.length];
  const ch = String(n || 'U').slice(0, 1);
  return svgURI(`<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
    <defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue},70%,58%)"/><stop offset="1" stop-color="hsl(${hue + 24},65%,38%)"/></linearGradient></defs>
    <rect width="160" height="160" rx="80" fill="url(#a)"/>
    <text x="80" y="104" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="72" fill="#ffffff" text-anchor="middle" font-weight="600">${ch}</text></svg>`);
};
const D = (d, hm = '10:30:00') => `2026-10-${String(d).padStart(2, '0')} ${hm}`;
const mk = (n, f) => Array.from({ length: n }, (_, i) => f(i + 1));

const pick = (arr, i) => arr[(i - 1) % arr.length];

/* ---------------------------------------------------------------- 通用 */
const pressTypes = [
  { id: 16, name: '今日要闻', sort: 1 },
  { id: 17, name: '本地资讯', sort: 2 },
  { id: 18, name: '政策解读', sort: 3 },
  { id: 19, name: '民生关注', sort: 4 },
  { id: 20, name: '科技创新', sort: 5 },
];

const newsTitles = [
  '我市智慧交通系统全面升级，主干道通行效率提升 23%',
  '数字政务“一网通办”新增 48 项高频事项，覆盖率达 96%',
  '城市大脑上线运行一周年，累计处置城市事件 12.6 万件',
  '全市新增 3200 个公共停车泊位，重点缓解老城区停车难',
  '地铁 5 号线二期工程进入联调联试阶段，预计年底开通',
  '我市入选国家智能社会治理实验基地，探索超大城市治理新路径',
  '社区“15 分钟生活圈”试点扩围，新增便民服务点 86 个',
  '城市供水管网智能化改造完成，漏损率下降至 8.2%',
  '“无废城市”建设成效显著，生活垃圾回收利用率达 38%',
  '数字人民币试点覆盖公交、地铁、缴费等 12 类场景',
  '全市 120 急救平均反应时间缩短至 11 分 24 秒',
  '智慧社区平台接入 1200 个小区，报修响应提速一倍',
  '我市发布城市体检报告，居民满意度连续三年上升',
  '新一代政务云平台完成扩容，支撑 400 余个业务系统',
  '夜间经济示范街区扩容，新增 6 个特色消费集聚区',
  '城市生命线安全工程一期建成，燃气管道监测全覆盖',
  '中小学课后服务“5+2”模式实现全域覆盖',
  '我市与三所高校共建城市治理联合实验室',
  '智慧文旅平台上线，一部手机畅游全城景区',
  '老旧小区改造开工 286 个，惠及居民 5.4 万户',
  '城市空气质量优良天数同比增加 18 天',
  '公共法律服务智能终端进驻 200 个社区',
  '我市启动城市更新三年行动，首批 32 个项目集中开工',
  '数字经济核心产业增加值同比增长 11.4%',
];

const newsBody = (title) =>
  `<p><strong>${title}</strong></p><p>近日，记者从市智慧城市建设领导小组办公室获悉，围绕“一网通办、一网统管、一屏通览”的总体目标，我市持续深化数据要素市场化配置改革，推动城市治理数字化转型取得阶段性成效。</p><p>据介绍，本期建设重点覆盖交通出行、政务服务、医疗健康、社区治理四大领域。通过统一数据底座和标准化接口，各部门业务系统实现互联互通，跨部门协同处置效率明显提升。</p><p>下一步，我市将扩大试点范围，完善数据安全与隐私保护机制，让市民在更多场景中感受到数字化带来的便利。</p><p>（来源：市智慧城市建设领导小组办公室）</p>`;

const press = mk(24, (i) => {
  const t = pick(pressTypes, i);
  return {
    id: i,
    appType: 'smart_city',
    cover: IMG('城市资讯', i, 640, 400),
    title: pick(newsTitles, i),
    subTitle: '智慧城市 · 数字化治理系列报道',
    content: newsBody(pick(newsTitles, i)),
    status: 'Y',
    publishDate: `2026-10-${String(22 - (i % 20)).padStart(2, '0')}`,
    tags: null,
    commentNum: 3 + ((i * 7) % 40),
    likeNum: 12 + ((i * 13) % 500),
    readNum: 200 + ((i * 157) % 4000),
    type: String(t.id),
    top: i <= 3 ? 'Y' : 'N',
    hot: i % 3 === 0 ? 'Y' : 'N',
    typeName: t.name,
  };
});

const rotation = mk(6, (i) => ({
  id: i,
  appType: 'smart_city',
  sort: i,
  status: '1',
  advTitle: pick(['智慧城市 · 让生活更简单', '一网通办 便民利企', '城市大脑 智慧治理', '绿色出行 低碳生活', '数字医疗 健康守护', '文旅融合 魅力之城'], i),
  advImg: IMG('城市轮播', i, 750, 360),
  servModule: pick(['新闻资讯', '停哪儿', '城市地铁', '生活交费', '门诊预约', '活动管理'], i),
  targetId: i,
  type: '2',
}));

const ALL_IMGS = Object.values(IMGS).flat();
const SERVICE_NAMES = ['停车场', '城市地铁', '外卖订餐', '找工作', '找房子', '智慧交管', '活动管理', '生活交费', '看电影', '门诊预约', '智慧巴士', '政府服务热线', '法律咨询', '志愿活动', '数字图书馆', '垃圾分类', '青年驿站', '爱心公益', '物流查询', '宠物医院'];
const service = mk(20, (i) => ({
  id: i,
  serviceName: pick(SERVICE_NAMES, i),
  serviceDesc: '智慧城市便民服务',
  serviceType: i <= 7 ? '车主服务' : '生活服务',
  imgUrl: ALL_IMGS[h32(pick(SERVICE_NAMES, i)) % ALL_IMGS.length],
  link: '/pages/service/index',
  sort: i,
  isRecommend: i <= 8 ? 'Y' : 'N',
}));

const balance = mk(12, (i) => ({
  id: i,
  appType: pick(['movie', 'park', 'metro', 'living', 'takeout'], i),
  userId: 2,
  event: pick(['缴纳违章罚款', '停车缴费', '地铁乘车', '电费缴纳', '外卖订单', '钱包充值', '电影购票', '话费充值'], i),
  changeAmount: pick([200, 5, 3, 100, 64, 500, 50, 49], i),
  changeType: i % 4 === 1 ? '收入' : '支出',
  userName: 'test02',
  changeTime: D(22 - i, `${String(9 + (i % 9)).padStart(2, '0')}:30:45`),
}));

const feedback = mk(5, (i) => ({
  id: i,
  appType: pick(['smart_city', 'park', 'metro', 'takeout', 'movie'], i),
  title: pick(['问题反馈', '界面建议', '功能异常', '数据错误', '体验建议'], i),
  content: pick([
    '首页轮播图点击后没有跳转到对应详情页，希望修复。',
    '停车场列表的距离排序不准确，建议按定位实时计算。',
    '地铁乘车码在弱网环境下加载较慢。',
    '订单状态显示与实际不符，已支付仍显示未支付。',
    '希望增加夜间模式，方便夜间使用。',
  ], i),
  userId: 2,
  createTime: D(20 - i),
}));

const pressComment = mk(8, (i) => ({
  id: i,
  appType: 'smart_city',
  newsId: 1 + (i % 3),
  content: pick(['这真是个好消息，期待早日落地。', '支持！希望覆盖更多社区。', '数据很详实，点赞。', '希望增加进度公示。'], i),
  commentDate: D(21 - i, '17:30:25'),
  userId: 2,
  likeNum: i * 3,
  userName: pick(['test02', '张三', '李四', '王五'], i),
  newsTitle: press[i % press.length].title,
}));

/* ---------------------------------------------------------------- 停哪儿 */
const lotNames = ['国际大厦停车场', '星海广场地下停车场', '高新万达地面停车场', '人民广场立体车库', '软件园 B 区停车场', '火车站南广场停车场', '青泥洼桥商圈车库', '东港音乐喷泉停车场', '西安路商圈停车场', '医大附一院内停车场', '体育中心 P3 停车场', '锦绣小区路侧泊位'];
const parkLot = mk(12, (i) => ({
  id: i,
  parkName: pick(lotNames, i),
  vacancy: String(pick([30, 12, 86, 5, 44, 0, 18, 62, 25, 9, 120, 3], i)),
  priceCaps: String(pick([30, 20, 15, 25, 10, 40, 8, 12], i)),
  imgUrl: IMG('停车场', i, 640, 360),
  rates: String(pick([5, 4, 4.5, 3, 5, 4.2], i)),
  address: pick(['大连市中山区人民路 66 号', '大连市沙河口区星海广场 A 区', '大连市甘井子区高新街 12 号', '大连市西岗区中山路 158 号'], i),
  distance: String(pick([20, 350, 800, 1200, 45, 2300], i)),
  allPark: String(pick([90, 60, 200, 40, 120, 300], i)),
  open: i === 6 ? 'N' : 'Y',
  lotType: i % 3 === 0 ? '地下' : '地面',
}));

const parkLotRecord = mk(8, (i) => ({
  id: i,
  lotId: 1 + (i % 4),
  entryTime: D(21 - i, '17:24:37'),
  outTime: D(21 - i, '18:24:45'),
  plateNumber: pick(['辽B12345', '辽B88888', '辽B66666', '辽B00001'], i),
  monetary: String(pick([5, 8, 12, 3], i)),
  parkName: pick(lotNames, i),
  userId: 2,
  duration: pick(['1 小时', '2 小时 30 分', '45 分钟'], i),
}));

const parkCar = mk(3, (i) => ({
  id: i,
  plateNo: pick(['辽B12345', '辽B66666', '辽B88888'], i),
  type: i === 1 ? '新能源车' : '汽油车',
  userId: 2,
  userName: 'test02',
  brand: pick(['比亚迪 汉', '大众 迈腾', '特斯拉 Model 3'], i),
  tel: '1380000000' + i,
}));

const carConsumption = mk(6, (i) => ({
  id: i,
  carId: 1 + (i % 3),
  plateNo: pick(['辽B12345', '辽B66666'], i),
  amount: pick([10, 20, 15, 30], i),
  gasFilling: pick([10, 20, 15, 30], i),
  travelDate: `2026-09-${String(10 + i).padStart(2, '0')}`,
  travelDistance: pick([120, 260, 88, 430], i),
  userId: 2,
}));

const parkProduct = mk(6, (i) => ({
  id: i,
  name: pick(['500 元加油卡', '洗车券（单次）', '车载吸尘器', '玻璃水 2L', '停车 1 小时抵扣券', '行车记录仪'], i),
  price: pick([500, 30, 199, 25, 5, 359], i),
  score: pick([300, 20, 150, 15, 3, 260], i),
  cover: IMG('积分商品', i, 400, 400),
  total: pick([100, 500, 60, 800, 999, 40], i),
  stock: pick([88, 300, 42, 500, 900, 20], i),
  isExchange: 'Y',
}));

const scoreLevel = mk(4, (i) => ({ id: i, name: pick(['普通', '白银', '黄金', '白金'], i), score: pick([0, 500, 1000, 3000], i), icon: IMG('等级', i, 120, 120) }));

/* ---------------------------------------------------------------- 城市地铁 */
const metroCity = mk(6, (i) => ({
  id: i,
  name: pick(['北京市', '上海市', '广州市', '深圳市', '大连市', '成都市'], i),
  code: 100 + i,
  imgUrl: IMG('地铁城市', i, 360, 240),
}));

const metroLine = mk(8, (i) => ({
  id: i,
  name: `${i} 号线`,
  first: pick(['西苑', '苹果园', '宋家庄', '天宫院'], i),
  end: pick(['北安河', '环球度假区', '亦庄火车站', '生物医药基地'], i),
  startTime: '05:25',
  endTime: '23:00',
  cityId: 5,
  stationsNumber: 18 + i,
  km: 20 + i * 3,
  runStationsName: '西苑,北宫门,安河桥北,海淀黄庄,人民大学',
  price: 3 + (i % 4),
  color: pick(['#2f6df6', '#e4393c', '#13a8a8', '#f6b73c', '#7d4bd8', '#36b37e'], i),
}));

const stationPool = ['西苑', '北宫门', '安河桥北', '海淀黄庄', '人民大学', '魏公村', '国家图书馆', '动物园', '西直门', '积水潭', '鼓楼大街', '安定门', '雍和宫', '东直门', '农业展览馆', '团结湖', '呼家楼', '金台夕照'];
const metroStep = mk(18, (i) => ({
  id: i,
  lineId: 1,
  lineName: '1 号线',
  name: stationPool[i % stationPool.length],
  sort: i,
  stationId: i,
  nextStation: stationPool[(i + 1) % stationPool.length],
  lines: [{ lineId: 1, lineName: '1 号线' }],
}));

const metroNotice = mk(6, (i) => ({
  id: i,
  title: pick(['乘车须知', '关于 5 号线二期施工期间运营调整的公告', '地铁安检新规实施公告', '节假日延长运营时间通知', '失物招领集中认领公告', '电子卡使用说明'], i),
  content: '为保障乘客出行安全与运营秩序，现将有关事项公告如下：一、请乘客主动配合安检；二、禁止携带易燃易爆等危险品进站；三、如遇客流管控请听从工作人员引导。',
  type: String(1 + (i % 3)),
  createTime: D(20 - i),
  readNum: 120 + i * 30,
}));

const metroFound = mk(6, (i) => ({
  id: i,
  imgUrl: IMG('失物', i, 400, 300),
  foundTime: `2026-09-${String(6 + i).padStart(2, '0')}`,
  foundPlace: pick(['1 号线西苑站 A 口', '2 号线西直门站站厅', '5 号线雍和宫站 3 号车厢', '10 号线国贸站'], i),
  title: pick(['黑色双肩包', '蓝色雨伞', '苹果手机', '学生卡', '钥匙串', '保温杯'], i),
  content: '请失主携带有效身份证件到车站客服中心认领，或拨打服务热线 96165。',
  status: '1',
  userId: 2,
  foundUserName: pick(['王先生', '李女士', '张同学'], i),
}));

const metroCard = mk(2, (i) => ({
  id: i,
  userName: '王大卫',
  idCard: '210211199909090014',
  phonenumber: '13800000000',
  cardNum: '20210427101538237' + i,
  userId: 2,
  balance: 50 + i * 20,
  status: '1',
  createTime: D(12),
}));

const metroRecord = mk(8, (i) => ({
  id: i,
  lineId: 1 + (i % 4),
  lineName: `${1 + (i % 4)} 号线`,
  start: pick(stationPool, i),
  stop: pick(stationPool, i + 2),
  price: 3 + (i % 4),
  onTime: D(21 - i, '20:02:02'),
  offTime: D(21 - i, '20:05:23'),
  userId: 2,
  userName: 'test02',
  cardNum: '202104271015382371',
}));

/* ---------------------------------------------------------------- 外卖订餐 */
const takeoutTheme = mk(6, (i) => ({
  id: i,
  themeName: pick(['美食', '快餐', '甜品饮品', '地方菜', '炸鸡汉堡', '轻食沙拉'], i),
  themeDesc: pick(['美食来找我', '快速送达', '甜蜜时光', '家乡味道', '香脆可口', '健康轻食'], i),
  imgUrl: IMG('外卖主题', i, 240, 240),
  sort: i,
}));

const sellerNames = ['皖北刘哥牛肉板面', '炸匠先森·韩式炸鸡', '柚见初夏奶茶', '老碗面·手工拉面', '川蜀冒菜小馆', '麦香烘焙工坊', '轻食日记沙拉', '湘遇小炒', '鲜芋仙甜品', '元气寿司', '兰州牛肉面（高新店）', '咖啡陪你'];
const takeoutSeller = mk(12, (i) => ({
  id: i,
  name: pick(sellerNames, i),
  address: pick(['辽宁省大连市甘井子区新新园 79 号', '辽宁省大连市沙河口区西安路 99 号', '辽宁省大连市中山区人民路 66 号'], i),
  introduction: pick(['各种汤面', '选好肉炸好鸡', '现煮茶饮', '手工现拉', '麻辣鲜香', '每日现烤'], i),
  themeId: 1 + (i % 6),
  score: 4 + (i % 10) / 10,
  saleQuantity: 200 + i * 57,
  deliveryTime: 20 + (i % 5) * 5,
  imgUrl: IMG('外卖商家', i, 640, 400),
  avgCost: 15 + (i % 6) * 8,
  other: null,
  recommend: i % 4 === 0 ? 'Y' : 'N',
  distance: 300 + i * 240,
  saleNum3hour: 10 + i * 3,
  deliveryFee: i % 3 === 0 ? 0 : 3,
  status: '1',
}));

const dishPool = ['柚见初夏套餐', '牛肉板面（大碗）', '韩式炸鸡（半只）', '麻辣冒菜套餐', '手工拉面', '芝士葡萄', '照烧鸡腿饭', '鲜虾云吞面', '轻食鸡胸沙拉', '红糖糍粑', '蒜香排骨饭', '杨枝甘露'];
const takeoutProduct = [];
for (let s = 1; s <= 12; s++) {
  for (let k = 0; k < 5; k++) {
    const id = (s - 1) * 5 + k + 1;
    takeoutProduct.push({
      id,
      sellerId: s,
      name: dishPool[(id - 1) % dishPool.length] + (k === 0 ? '' : ` ${['小份', '大份', '套餐', '加料', '单人餐'][k]}`),
      price: 12 + ((id * 7) % 40),
      imgUrl: IMG('菜品', id, 400, 400),
      saleQuantity: 30 + ((id * 17) % 600),
      introduction: '选用新鲜食材，现点现做，口感更佳。',
      categoryId: 1 + (k % 3),
      status: '1',
      praiseRate: 90 + (id % 10),
    });
  }
}

const takeoutCategory = mk(6, (i) => ({ id: i, name: pick(['热销', '主食', '小吃', '饮品', '套餐', '新品'], i), sellerId: 1, themeId: 1, sort: i }));

const takeoutAddress = mk(3, (i) => ({
  id: i,
  userId: 2,
  name: pick(['王大卫', '王先生', '李女士'], i),
  phone: '1589813527' + i,
  addressDetail: pick(['大连理工大学教学楼 A3-118', '大连市甘井子区软件园路 1 号', '大连市沙河口区西安路 99 号 5 层'], i),
  houseNumber: '',
  label: pick(['学校', '公司', '家'], i),
  isDefault: i === 1 ? 'Y' : 'N',
  longitude: '121.614682',
  latitude: '38.914003',
}));

const takeoutOrder = mk(5, (i) => ({
  id: i,
  orderNo: '20261011204446125' + (90 + i),
  userId: 2,
  sellerId: 1 + (i % 4),
  sellerName: pick(sellerNames, i),
  amount: pick([64, 32, 48, 25, 88], i),
  orderStatus: pick(['待付款', '待配送', '配送中', '待评价', '已完成'], i),
  paymentType: '电子支付',
  createTime: D(21 - i, '12:30:00'),
  addressDetail: '大连理工大学教学楼 A3-118',
  receiverName: '王大卫',
  receiverPhone: '13800000000',
  remark: '',
  orderItemList: [
    { productId: 1 + (i % 10), productName: pick(dishPool, i), quantity: 2, price: 18, productImage: IMG('菜品', i, 200, 200) },
  ],
}));

const takeoutComment = mk(8, (i) => ({
  id: i,
  sellerId: 1 + (i % 6),
  sellerName: pick(sellerNames, i),
  userId: 2,
  userName: pick(['test02', '小明', '吃货一号'], i),
  score: 4 + (i % 2),
  content: pick(['真好吃，下次还来', '分量足，出餐快', '味道不错，就是有点咸', '配送小哥很准时'], i),
  commentDate: D(20 - i),
  avatar: AV('用户'),
  imgUrl: IMG('评价', i, 200, 200),
}));

/* ---------------------------------------------------------------- 找工作 */
const companyNames = ['恒但科技公司', '虎鱼科技', '大连云智数据', '海创软件', '中软国际（大连）', '亿达信息'];
const jobCompany = mk(6, (i) => ({
  id: i,
  companyName: pick(companyNames, i),
  introductory: '公司始终坚持“踏实、诚信、合作、创新”的经营理念，专注于智慧城市与行业数字化解决方案，现有员工 300 余人。',
  address: pick(['大连市高新园区软件园路 1 号', '大连市沙河口区西安路 99 号'], i),
  scale: pick(['100-499 人', '500-999 人', '50-99 人'], i),
  industry: '计算机软件',
  imgUrl: IMG('企业', i, 300, 300),
  tel: '0411-8888' + i,
}));

const profession = mk(8, (i) => ({ id: i, professionName: pick(['Java 开发工程师', '前端开发工程师', 'UI 设计师', '产品经理', '测试工程师', '数据分析师', '运维工程师', 'Android 开发'], i), sort: i }));

const jobPost = mk(10, (i) => ({
  id: i,
  companyId: 1 + (i % 6),
  companyName: pick(companyNames, i),
  professionId: 1 + (i % 8),
  professionName: pick(['Java 开发工程师', '前端开发工程师', 'UI 设计师', '产品经理', '测试工程师'], i),
  contacts: pick(['张先生', '李女士'], i),
  name: pick(['软件开发', '前端开发', '视觉设计', '产品运营', '自动化测试'], i),
  obligation: '负责业务系统的设计、开发、测试以及上线；参与需求评审与技术方案设计；持续优化系统性能。',
  address: pick(['大连市万达广场', '大连市高新园区', '大连市中山区'], i),
  need: pick(['工作经验 1-2 年', '应届毕业生', '工作经验 3-5 年'], i),
  salary: String(pick([5000, 8000, 12000, 6500, 15000], i)),
  education: pick(['本科', '大专', '硕士'], i),
  createTime: D(20 - i),
}));

/* ---------------------------------------------------------------- 找房子 */
const housePool = [
  ['西安路 08 年框架电梯房 70 年 LOFT 一室一厅封闭小区', '租房', 88, '28300/㎡'],
  ['星海广场海景两居 精装修 拎包入住', '租房', 96, '4200/月'],
  ['高新园区地铁口小户型 通勤首选', '租房', 45, '2100/月'],
  ['中山区学区房 三室两厅 南北通透', '二手房', 128, '26800/㎡'],
  ['甘井子区新房 首付 30 万起', '新房', 89, '15800/㎡'],
  ['软件园旁合租单间 押一付一', '租房', 22, '1200/月'],
  ['东港商务区 loft 复式 精装', '租房', 60, '3600/月'],
  ['锦绣小区两室一厅 家电齐全', '租房', 78, '2600/月'],
];
const house = mk(8, (i) => {
  const [name, type, area, price] = housePool[i - 1];
  return {
    id: i,
    sourceName: name,
    address: name,
    areaSize: area,
    tel: '1854647454' + i,
    price,
    houseType: type,
    pic: IMG('房源', i, 640, 420),
    description: '房屋采光良好，周边配套齐全，交通便利，临近地铁与商圈。小区绿化率高，物业 24 小时安保。',
    district: pick(['沙河口区', '中山区', '甘井子区', '西岗区'], i),
    floor: pick(['中楼层/18 层', '高楼层/32 层', '低楼层/6 层'], i),
    orientation: pick(['南北', '东南', '南'], i),
  };
});

/* ---------------------------------------------------------------- 智慧交管 */
const trafficCar = mk(3, (i) => ({
  id: i,
  plateNo: pick(['辽B12345', '辽B66666', '辽B88888'], i),
  type: i === 1 ? '新能源车' : '汽油车',
  userId: 2,
  userName: 'test02',
  engineNo: 'EA888' + (1000 + i),
  frameNo: 'LSVAM4185E2' + (100 + i),
  registerDate: '2020-06-1' + i,
}));

const illegalTypes = ['超速行驶', '违反禁止标线指示', '不按交通信号灯通行', '违规停车', '未系安全带', '驾驶时拨打接听手持电话'];
const trafficIllegal = mk(6, (i) => ({
  id: i,
  carId: 1 + (i % 3),
  plateNo: pick(['辽B12345', '辽B66666'], i),
  illegalType: pick(illegalTypes, i),
  illegalTime: D(21 - i, '08:12:33'),
  illegalAddress: pick(['大连市中山路与人民路交叉口', '大连市西安路 200 米处', '大连市东北路高架桥'], i),
  money: pick([200, 100, 200, 50, 150], i),
  deductPoints: pick([6, 3, 6, 0, 2], i),
  status: i <= 3 ? '未处理' : '已处理',
  code: '2102' + (100000 + i),
  handleType: i <= 3 ? '待处理' : '已缴款',
  userId: 2,
  imgUrl: IMG('违章抓拍', i, 480, 320),
}));

const trafficNotice = mk(4, (i) => ({
  id: i,
  title: pick(['关于中山路部分路段施工期间交通管制的通告', '新增 12 处电子警察设备的公示', '国庆假期交通安全出行提示', '机动车年检新规解读'], i),
  content: '为保障道路交通安全与畅通，根据《中华人民共和国道路交通安全法》有关规定，现就有关事项通告如下。',
  publishTime: D(20 - i),
  type: '1',
  readNum: 300 + i * 120,
}));

const checkPlace = mk(6, (i) => ({
  id: i,
  placeName: pick(['丰台区潘北昊盛汽车检测场', '大连市机动车检测中心', '甘井子区顺通检测站', '金州新区安达检测场'], i),
  address: pick(['大连市甘井子区华北路 100 号', '大连市金州区胜利路 8 号'], i),
  tel: '0411-8666' + (1000 + i),
  workTime: '周一至周五 08:30-17:00',
  price: 300,
  status: '1',
}));

const trafficLicense = {
  id: 1,
  userId: 2,
  licenseNo: '210211199909090014',
  licenseLevel: 'C1',
  idCard: '210211199909090014',
  score: 6,
  applyDate: '2020-02-12',
  verifyDate: '10 年',
  startDate: '2020-02-12',
  endDate: '2030-02-11',
  status: '1',
  name: '王大卫',
  avatar: AV('王大卫'),
};

/* ---------------------------------------------------------------- 活动管理 */
const activityCategory = mk(5, (i) => ({ id: i, name: pick(['跑步', '公益', '亲子', '讲座', '运动'], i), imgUrl: IMG('活动分类', i, 200, 200), sort: i }));

const activityPool = [
  ['相约长跑 10 公里', '跑步'],
  ['城市清洁志愿行动', '公益'],
  ['亲子科技体验营', '亲子'],
  ['智慧城市主题讲座', '讲座'],
  ['社区篮球友谊赛', '运动'],
  ['重阳节敬老慰问', '公益'],
  ['城市定向越野挑战赛', '运动'],
  ['青少年编程公益课堂', '讲座'],
  ['春日植树计划', '公益'],
  ['全民健身广场舞大赛', '运动'],
];
const activity = mk(10, (i) => {
  const [name, cat] = activityPool[i - 1];
  return {
    id: i,
    name,
    content: `<p><strong>${name}</strong></p><p>为丰富市民文化生活，倡导健康文明生活方式，现组织开展本次活动。请参与者按活动要求准时到场，服从现场工作人员安排。</p><p>活动免费，名额有限，报满即止。</p>`,
    imgUrl: IMG('活动', i, 640, 400),
    categoryId: 1 + (i % 5),
    categoryName: cat,
    recommend: i <= 3 ? 'Y' : 'N',
    signupNum: 20 + i * 7,
    likeNum: 30 + i * 11,
    status: '1',
    publishTime: D(22 - i, '10:38:02'),
    address: pick(['大连市星海广场', '大连市劳动公园', '大连市高新园区软件园', '大连市体育中心'], i),
    startTime: `2026-11-${String(5 + i).padStart(2, '0')} 09:00`,
    endTime: `2026-11-${String(5 + i).padStart(2, '0')} 12:00`,
    limitNum: 100 + i * 20,
  };
});

const activityComment = mk(6, (i) => ({
  id: i,
  userId: 2,
  activityId: 1 + (i % 4),
  activityName: activity[i % activity.length].name,
  content: pick(['我喜欢这个活动', '已经报名了，期待', '活动组织得很棒', '希望增加名额'], i),
  commentTime: D(21 - i, '16:35:54'),
  userName: pick(['test02', 'admin'], i),
  nickName: pick(['小逻辑', '测试用户'], i),
  avatar: AV('用户'),
}));

/* ---------------------------------------------------------------- 生活交费 */
const livingCategory = mk(6, (i) => ({
  id: i,
  liveName: pick(['手机话费', '电费', '水费', '燃气费', '有线电视', '宽带费'], i),
  imgUrl: IMG('缴费分类', i, 160, 160),
  sort: i,
  status: '1',
}));

const livingBill = mk(5, (i) => ({
  id: i,
  billNo: '202610271358091' + i,
  title: pick(['第一季度电费', '10 月水费', '9 月燃气费', '宽带续费', '有线电视费'], i),
  amount: pick([100, 45, 68, 120, 25], i),
  chargeUnit: pick(['水电公司', '燃气公司', '通信运营商'], i),
  address: '大连高新园区大华锦绣 3 号楼 2 单元 2803',
  paymentNo: '1567493' + i,
  categoryId: 1 + (i % 6),
  payStatus: i <= 2 ? '未缴费' : '已缴费',
  createTime: D(20 - i),
  deadline: `2026-11-${String(10 + i).padStart(2, '0')}`,
  userId: 2,
}));

const livingAccount = mk(3, (i) => ({
  id: i,
  ownerName: '王大卫',
  idCard: '210211199909090014',
  address: pick(['大连高新园区大华锦绣 3 号楼 2 单元 2803', '大连市沙河口区西安路 99 号'], i),
  paymentNo: '1566608' + i,
  categoryId: 1 + i,
  userId: 2,
  categoryName: pick(['电费', '水费', '燃气费'], i),
}));

const phoneRule = mk(4, (i) => ({ ruleId: i, rechargeAmount: pick([50, 100, 200, 300], i), backAmount: pick([1, 2, 5, 10], i), sort: i, status: '1', desc: `充 ${pick([50, 100, 200, 300], i)} 返 ${pick([1, 2, 5, 10], i)}` }));

const phoneRecord = mk(5, (i) => ({
  id: i,
  title: '话费充值',
  phonenumber: '13800000000',
  rechargeAmount: pick([50, 100, 20, 200], i),
  paymentAmount: pick([49, 98, 20, 190], i),
  paymentType: '电子支付',
  rechargeTime: D(21 - i, '13:43:36'),
  userId: 2,
  status: '1',
}));

const livingPress = mk(12, (i) => ({
  ...press[i - 1],
  id: i,
  appType: 'living',
  type: String(26 + (i % 3)),
  title: pick(['卓创资讯：猪价放量急跌，多地猪价破“10”', '今起居民电价阶梯标准调整，一图看懂', '天然气安全使用提示：这些细节要注意', '供水管网改造完成，部分区域将短时停水', '宽带提速降费新政落地，老用户可免费升级'], i),
}));

/* ---------------------------------------------------------------- 看电影 */
const filmPool = [
  ['悬崖之上', '3', '动作'], ['变形金刚：超能勇士崛起', '8', '科幻'], ['你好，李焕英', '4', '喜剧'],
  ['长津湖', '7', '战争'], ['爱情神话', '2', '爱情'], ['误杀 2', '6', '惊悚'],
  ['我和我的祖国', '1', '故事'], ['寂静之地', '5', '恐怖'], ['流浪地球 2', '8', '科幻'],
  ['满江红', '1', '故事'],
];
const film = mk(10, (i) => {
  const [name, cat, catName] = filmPool[i - 1];
  return {
    id: i,
    name,
    category: cat,
    categoryName: catName,
    cover: IMG('电影海报', i, 400, 560),
    playType: pick(['3', '2', '1'], i),
    playTypeName: pick(['2D', '3D', 'IMAX'], i),
    score: 7 + (i % 30) / 10,
    duration: 100 + i * 3,
    playDate: `2026-10-${String(25 - i).padStart(2, '0')}`,
    likeNum: 1000 + i * 4321,
    favoriteNum: 2000 + i * 6789,
    language: '中文',
    introduction: `<p>影片讲述了一段发生在特殊年代的故事，主人公在困境中坚守信念，最终迎来曙光。</p>`,
    other: null,
    recommend: i <= 4 ? 'Y' : 'N',
    director: pick(['张艺谋', '郭帆', '贾玲', '陈凯歌'], i),
    actors: pick(['张译 / 于和伟 / 秦海璐', '吴京 / 刘德华 / 李雪健', '沈腾 / 易烊千玺', '黄渤 / 周迅'], i),
  };
});

const theatre = mk(6, (i) => ({
  id: i,
  name: pick(['金逸影城', '万达影城（高新店）', 'CGV 影城', '博纳国际影城', '大地影院', '横店影城'], i),
  cover: IMG('影院', i, 640, 360),
  province: '辽宁省',
  city: '大连市',
  area: pick(['沙河口区', '中山区', '甘井子区'], i),
  address: pick(['西安路 99 号福佳新天地 5 层', '高新园区万达广场 4 层', '中山区人民路 66 号'], i),
  score: 4 + (i % 10) / 10,
  tags: 'IMAX,杜比全景声,3D',
  brand: pick(['万达', '金逸', 'CGV'], i),
  distance: `${(i * 300 + 200)} 米`,
  status: 'Y',
  movieId: null,
  timesId: null,
  tel: '0411-8888' + i,
}));

const room = mk(4, (i) => ({ id: i, theaterId: 1, name: `${i} 厅`, status: 'N', seatRows: 8, seatCols: 12, type: i === 1 ? 'IMAX' : '普通厅' }));

const times = [];
for (let f = 1; f <= 10; f++) {
  for (let t = 1; t <= 3; t++) {
    times.push({
      id: (f - 1) * 3 + t,
      theaterId: 1 + ((f + t) % 6),
      roomId: 1 + (t % 4),
      movieId: f,
      movieName: film[f - 1].name,
      startTime: ['10:20', '14:05', '19:30'][t - 1],
      endTime: ['12:30', '16:15', '21:40'][t - 1],
      price: 35 + t * 10,
      playType: pick(['3', '2', '1'], f),
      playDate: '2026-10-25',
      saleNum: 20 + f * 5,
      totalNum: 96,
      status: '1',
    });
  }
}

const seats = [];
for (let r = 1; r <= 8; r++) {
  for (let c = 1; c <= 12; c++) {
    const id = (r - 1) * 12 + c;
    seats.push({ id, roomId: 1, row: String(r), col: String(c), type: r <= 2 ? 'VIP' : null, status: (r * c) % 13 === 0 ? 'N' : 'Y' });
  }
}

const filmComment = mk(8, (i) => ({
  id: i,
  movieId: 1 + (i % 5),
  movieName: film[i % film.length].name,
  userId: 2,
  userName: pick(['test02', '影迷小王', '电影爱好者'], i),
  score: 4 + (i % 2),
  content: pick(['一部变形金刚，令无数人不能自已', '画面震撼，剧情紧凑', '演员表演到位，值得二刷', '节奏稍慢，但整体不错'], i),
  commentDate: D(20 - i, '00:00:00').slice(0, 10),
  likeNum: 60 + i * 30,
  avatar: AV('影迷'),
}));

const ticketOrder = mk(5, (i) => ({
  id: i,
  orderNo: '20261009000953564' + (30 + i),
  theaterId: 1 + (i % 4),
  theaterName: pick(['金逸影城', '万达影城（高新店）'], i),
  roomId: 1 + (i % 3),
  roomName: `${1 + (i % 3)} 厅`,
  timesId: 1 + i,
  movieId: 1 + (i % 5),
  movieName: film[i % film.length].name,
  price: 45 + i * 5,
  num: 2,
  status: i <= 2 ? '未支付' : '已支付',
  userId: 2,
  createTime: D(21 - i, '15:20:00'),
  playDate: '2026-10-25',
  startTime: '19:30',
  seatInfo: '5 排 6 座,5 排 7 座',
}));

const moviePressTitles = [
  '《悬崖之上》票房破 10 亿，张艺谋谈拍摄幕后',
  '《流浪地球 2》重映定档，科幻工业再进一步',
  '国庆档影片阵容公布，八部新片同台竞技',
  '《你好，李焕英》舞台剧版启动全国巡演',
  'IMAX 中国区银幕突破 800 块，观影体验升级',
  '《长津湖》获评年度最受欢迎影片',
  '暑期档票房创历史新高，动画电影表现亮眼',
  '影院会员体系升级，观影更实惠',
];
const moviePress = mk(8, (i) => ({
  id: i,
  appType: 'movie',
  cover: IMG('电影海报', i, 640, 400),
  title: pick(moviePressTitles, i),
  subTitle: '影视资讯 · 每日更新',
  content: '<p>据发行方消息，影片自上映以来口碑持续走高，排片占比稳步提升。</p>',
  status: 'Y',
  publishDate: `2026-10-${String(22 - i).padStart(2, '0')}`,
  commentNum: 3 + i,
  likeNum: 50 + i * 13,
  readNum: 500 + i * 120,
  type: String(30 + (i % 3)),
  top: i <= 2 ? 'Y' : 'N',
  hot: i % 3 === 0 ? 'Y' : 'N',
}));

/* ---------------------------------------------------------------- 门诊预约 */
const hospitalNames = ['大连市儿童医院', '大连医科大学附属第一医院', '大连市中心医院', '大连市友谊医院', '大连市中医医院', '大连市妇幼保健院', '大连市口腔医院', '大连市皮肤病医院'];
const hospital = mk(8, (i) => ({
  id: i,
  hospitalName: pick(hospitalNames, i),
  brief: '医院创建于 1952 年，经过几代人的艰苦奋斗，已成长为一所学科门类齐全、师资力量雄厚、医疗技术精湛、诊疗设备先进的综合性医院。',
  level: 3 + (i % 2),
  levelName: pick(['三级甲等', '三级乙等', '二级甲等'], i),
  imgUrl: IMG('医院', i, 640, 360),
  address: pick(['大连市西岗区中山路 154 号', '大连市沙河口区联合路 62 号'], i),
  tel: '0411-8363' + (1000 + i),
  category: pick(['综合医院', '专科医院', '中医医院'], i),
}));

const hospitalCategory = mk(10, (i) => ({
  id: i,
  type: i <= 5 ? '1' : '2',
  typeName: i <= 5 ? '专家诊' : '普通诊',
  categoryName: pick(['儿科', '神经内科', '心血管内科', '骨科', '皮肤科', '眼科', '口腔科', '呼吸内科', '消化内科', '中医科'], i),
  money: pick([6, 8, 5, 10, 6], i),
  hospitalId: 1 + (i % 3),
  introduction: '科室技术力量雄厚，拥有多名主任医师，年门诊量超过 10 万人次。',
}));

const patient = mk(3, (i) => ({
  id: i,
  name: pick(['张亮', '王大卫', '李小雨'], i),
  cardId: '21002119900000000' + i,
  tel: '1581000000' + i,
  sex: String(i % 2),
  birthday: pick(['2001-09-10', '1999-09-09', '2015-03-21'], i),
  address: '大连市甘井子区大华小区',
  userId: 2,
  imgUrl: AV('就诊人'),
}));

const reservation = mk(4, (i) => ({
  id: i,
  orderNo: '160353766321' + i,
  patientName: pick(['王大卫', '张亮'], i),
  categoryId: 1 + i,
  categoryName: pick(['儿科', '神经内科', '心血管内科', '骨科'], i),
  type: '1',
  money: 6 + i,
  reserveTime: `2026-11-0${i + 2} 09:00`,
  status: i <= 2 ? '待就诊' : '已完成',
  hospitalId: 1 + (i % 3),
  hospitalName: pick(hospitalNames, i),
  createTime: D(20 - i),
  userId: 2,
}));

/* ---------------------------------------------------------------- 智慧巴士 */
const busStops = mk(12, (i) => ({
  id: i,
  name: pick(['光谷金融街', '南湖大厦', '软件园东路', '高新管委会', '理工大学北门', '星海公园', '会展中心', '人民广场'], i),
  address: pick(['大连市高新园区软件园路', '大连市沙河口区中山路'], i),
  longitude: '121.61' + i,
  latitude: '38.91' + i,
  lineIds: [1, 2],
  distance: 100 + i * 80,
}));

const busLine = mk(5, (i) => ({
  id: i,
  name: pick(['一号线', '二号线', '三号线', '五号线', '机场专线'], i),
  first: pick(['光谷金融街', '南湖大厦', '软件园东路'], i),
  end: pick(['南湖大厦', '会展中心', '星海公园'], i),
  startTime: '6:30',
  endTime: '19:45',
  price: 2 + i,
  mileage: String(15 + i * 4),
  interval: '8-12 分钟',
  stationNumber: 12 + i,
  stations: busStops.slice(0, 5 + i).map((s) => ({ id: s.id, name: s.name, sort: s.id })),
}));

const busOrder = mk(3, (i) => ({
  id: i,
  orderNum: '5204210' + i,
  lineId: 1 + i,
  lineName: pick(['一号线', '二号线'], i),
  startStop: '软件园东路',
  endStop: '会展中心',
  price: 3,
  status: '已完成',
  createTime: D(20 - i, '08:12:00'),
  userId: 2,
  payType: '电子支付',
  travelDate: `2026-10-${String(20 - i).padStart(2, '0')}`,
}));

/* ---------------------------------------------------------------- 政府热线 */
const appealCategory = mk(6, (i) => ({ id: i, name: pick(['衣食住行', '市政设施', '环境保护', '教育医疗', '交通出行', '其他'], i), sort: i, imgUrl: IMG('诉求分类', i, 160, 160) }));

const appeal = mk(5, (i) => ({
  id: i,
  userId: 2,
  appealCategoryId: 1 + i,
  appealCategoryName: pick(['衣食住行', '市政设施', '环境保护', '教育医疗', '交通出行'], i),
  title: pick(['这是一个诉求', '小区门口路灯损坏', '夜间施工噪音扰民', '公交站牌信息错误', '希望增设便民服务点'], i),
  content: pick(['因为疫情，物价实在太高了，请处理一下。', '小区门口路灯已经损坏两周，夜间出行不安全。', '附近工地夜间施工，噪音严重影响休息。'], i),
  undertaker: pick(['物价局', '城管局', '生态环境局', '交通运输局'], i),
  state: String(1 + (i % 3)),
  stateName: pick(['待受理', '办理中', '已办结'], i),
  createTime: D(21 - i, '15:38:50'),
  detailResult: '已转交相关部门核实处理，处理结果将第一时间反馈。',
  imgUrl: IMG('诉求', i, 480, 320),
}));

/* ---------------------------------------------------------------- 法律咨询 */
const expertise = mk(6, (i) => ({ id: i, name: pick(['婚姻家庭', '劳动争议', '合同纠纷', '交通事故', '刑事辩护', '房产纠纷'], i), sort: i, imgUrl: IMG('法律专长', i, 160, 160) }));

const lawyer = mk(8, (i) => ({
  id: i,
  name: pick(['刘律师', '王律师', '张律师', '陈律师', '李律师'], i) + (i > 5 ? '（合伙人）' : ''),
  legalExpertiseId: 1 + (i % 6),
  legalExpertiseName: pick(['婚姻家庭', '劳动争议', '合同纠纷', '交通事故'], i),
  avatarUrl: AV('律师'),
  baseInfo: '执业 12 年，擅长民商事纠纷处理，累计代理案件 300 余件。',
  workingYears: 5 + i,
  score: 4 + (i % 10) / 10,
  serviceTimes: 100 + i * 45,
  likeCount: 20 + i * 13,
  goodAt: pick(['婚姻家事、财产分割', '劳动仲裁、工伤赔偿', '合同审查、商事诉讼'], i),
  workStartAt: pick(['2012-07-01', '2015-03-15', '2010-09-01', '2018-06-20'], i),
  favorableRate: 92 + (i % 8),
  tel: '1390000000' + i,
  firm: pick(['辽宁恒信律师事务所', '北京市京师（大连）律师事务所'], i),
}));

const legalAdvice = mk(6, (i) => ({
  id: i,
  fromUserId: 2,
  fromUserName: 'test02',
  fromUserAvatar: AV('用户'),
  lawyerId: 1 + (i % 6),
  lawyerName: pick(['刘律师', '王律师'], i),
  legalExpertiseId: 1 + (i % 6),
  legalExpertiseName: pick(['婚姻家庭', '劳动争议', '合同纠纷'], i),
  content: pick(['请问我和邻居打了一架，需要负法律责任吗？', '公司拖欠工资两个月，我该怎么维权？', '租房合同没到期房东要收回房子，合法吗？'], i),
  imageUrls: IMG('咨询图片', i, 400, 300),
  createTime: D(20 - i, '15:19:30'),
  evaluateContent: '回答很专业，谢谢律师。',
  score: 5,
  likeCount: i * 4,
  myLikeState: false,
  answerContent: '根据《民法典》相关规定，建议您先固定证据，再通过协商或诉讼途径解决。',
  answerTime: D(20 - i, '16:40:00'),
}));

/* ---------------------------------------------------------------- 志愿活动 */
const volunteerNews = mk(8, (i) => ({
  id: i,
  title: pick(['“中国首善”如何捐赠', '多想——志愿活动感怀', '我国第一部 1000 集双语版国学片杀青', '志愿服务时长可兑换公共服务', '青年志愿者协会招募公告'], i),
  imgUrl: IMG('志愿资讯', i, 640, 360),
  content: '<p>志愿服务是社会文明进步的重要标志。近年来，我市注册志愿者人数持续增长，服务领域不断拓展。</p>',
  createTime: D(21 - i),
  author: '市文明办',
  readNum: 200 + i * 60,
}));

const volunteerActivity = mk(6, (i) => ({
  id: i,
  title: pick(['城市清洁志愿行动', '敬老院陪伴计划', '社区图书整理志愿服务', '交通文明劝导', '青少年科普志愿课堂', '马拉松赛事志愿服务'], i),
  imgUrl: IMG('志愿活动', i, 640, 360),
  undertaker: pick(['市青年志愿者协会', '新华城市', '市文明办'], i),
  startAt: `2026-11-${String(3 + i).padStart(2, '0')}`,
  endAt: `2026-11-${String(3 + i).padStart(2, '0')} 17:00`,
  requireText: '18-45 周岁，身体健康，有责任心',
  detail: '为弘扬奉献、友爱、互助、进步的志愿精神，现面向社会招募志愿者。服务内容包括现场引导、秩序维护、物资分发等。',
  state: '1',
  signupNum: 12 + i * 5,
  limitNum: 50,
  address: pick(['大连市星海广场', '大连市劳动公园', '大连市图书馆'], i),
}));

/* ---------------------------------------------------------------- 数字图书馆 */
const library = mk(8, (i) => ({
  id: i,
  name: pick(['城市与文明：一部城市史', '数字治理：从理念到实践', '智慧交通系统导论', '人工智能简史', '中国古典文学导读', '数据可视化设计', '公共管理与政策分析', '海洋与城市'], i),
  author: pick(['刘易斯·芒福德', '张维迎', '李德毅', '吴军', '叶嘉莹'], i),
  cover: IMG('图书', i, 400, 560),
  introduction: '本书系统梳理了相关领域的理论与实践，适合作为高校教材及行业从业者的参考读物。',
  publisher: pick(['商务印书馆', '中信出版社', '机械工业出版社'], i),
  publishDate: pick(['2021-05-01', '2020-09-01', '2022-03-01'], i),
  category: pick(['城市规划', '计算机', '文学', '管理'], i),
  score: 8 + (i % 20) / 10,
  readNum: 100 + i * 88,
  commentNum: 3 + i,
  isbn: '978-7-100-1' + (2000 + i),
  location: `市图书馆 ${1 + (i % 3)} 楼 ${String(10 + i)} 排`,
}));

const libraryComment = mk(6, (i) => ({
  id: i,
  libraryId: 1 + (i % 4),
  libraryName: pick(['城市与文明：一部城市史', '数字治理：从理念到实践'], i),
  userId: 2,
  userName: pick(['test02', '读者小王'], i),
  avatar: AV('读者'),
  content: pick(['内容详实，值得一读。', '案例丰富，对工作很有启发。', '排版一般，但观点新颖。'], i),
  createTime: D(20 - i),
  likeNum: i * 6,
  myLikeState: false,
}));

/* ---------------------------------------------------------------- 垃圾分类 */
const garbageNewsType = mk(5, (i) => ({ id: 6 + i, name: pick(['党员在行动', '分类达人', '社区动态', '政策解读', '科普知识'], i), sort: i + 1 }));

const garbageNews = mk(8, (i) => ({
  id: i,
  type: 6 + (i % 5),
  typeName: pick(['党员在行动', '分类达人', '社区动态'], i),
  title: pick(['中敖幼儿园 2021 年垃圾分类系列活动总结', '社区开展垃圾分类入户宣传', '垃圾分类“红黑榜”第三期公布', '厨余垃圾变废为宝实践案例'], i),
  imgUrl: IMG('垃圾分类资讯', i, 640, 360),
  content: '<p>为深入推进生活垃圾分类工作，提升居民分类意识，各社区积极开展形式多样的宣传活动。</p>',
  createTime: D(21 - i),
  readNum: 100 + i * 40,
  commentNum: i * 2,
}));

const garbageClass = mk(4, (i) => ({
  id: 7 + i,
  name: pick(['湿垃圾', '干垃圾', '可回收物', '有害垃圾'], i),
  sort: i + 1,
  imgUrl: IMG('分类桶', i, 300, 300),
  introduce: '即易腐垃圾，易腐的生物质生活废弃物。湿垃圾应从产生时就与其他品种垃圾分开收集。',
  guide: '1、湿垃圾投放需破袋处理。\n2、投放前尽量沥干水分。\n3、有包装物的应去除包装后分类投放。',
  color: pick(['#8b5a2b', '#4a4a4a', '#2f6df6', '#d93025'], i),
}));

const garbageExample = mk(10, (i) => ({
  id: i,
  name: pick(['剩菜剩饭', '果皮', '塑料瓶', '旧报纸', '废电池', '过期药品', '陶瓷碗', '烟头', '纸箱', '玻璃瓶'], i),
  garbageClassificationId: 7 + (i % 4),
  garbageClassificationName: pick(['湿垃圾', '干垃圾', '可回收物', '有害垃圾'], i),
  imgUrl: IMG('垃圾示例', i, 240, 240),
  keyword: pick(['湿', '干', '可回收', '有害'], i),
  searchTimes: 5 + i * 3,
}));

const poster = mk(4, (i) => ({ id: i, title: pick(['垃圾分类 从我做起', '参与垃圾分类 共建美好家园', '分类一小步 文明一大步', '绿色生活 低碳出行'], i), sort: i, imgUrl: IMG('宣传海报', i, 600, 800) }));

/* ---------------------------------------------------------------- 青年驿站 */
const youthArea = mk(6, (i) => ({
  id: i,
  name: pick(['大连市中山区', '大连市西岗区', '大连市沙河口区', '大连市甘井子区', '大连市高新园区', '大连市金普新区'], i),
  imgUrl: IMG('区域', i, 640, 360),
  introduce: '该区域是大连市的核心功能区，交通便利，产业集聚，配套完善，为青年人才提供良好的发展环境。',
}));

const youthPolicy = mk(8, (i) => ({
  id: i,
  areaId: 1 + (i % 6),
  areaName: pick(['大连市中山区', '大连市高新园区'], i),
  title: pick(['大连市中山区人才补贴政策 2026 年最新版', '高校毕业生就业创业补贴申领指南', '青年人才公寓申请条件说明', '高层次人才安家费发放办法'], i) + (i > 4 ? '（补充）' : ''),
  author: pick(['刘先生', '市人社局'], i),
  content: '<p>01、坚持把稳定和扩大就业作为经济社会发展的优先目标，坚持创造更多就业岗位和稳定现有就业岗位并重。</p><p>02、对首次来我市就业的高校毕业生，按规定给予生活补贴和租房补贴。</p>',
  createTime: D(21 - i, '07:58:28'),
  readNum: 100 + i * 50,
}));

const youthInn = mk(6, (i) => ({
  id: i,
  name: pick(['星海青年驿站', '高新青年驿站', '中山青年驿站', '金普青年驿站'], i),
  imgUrl: IMG('青年驿站', i, 640, 420),
  address: pick(['大连市沙河口区星海广场 A 区', '大连市高新园区软件园路 1 号'], i),
  price: 0,
  tel: '0411-8888' + i,
  introduce: '为来连求职的青年人才提供 7 天免费住宿，配套共享办公、就业指导等服务。',
  roomType: pick(['四人间', '六人间', '双人间'], i),
  bedNum: 20 + i * 5,
  freeDays: 7,
  score: 4.5,
}));

/* ---------------------------------------------------------------- 爱心公益 */
const welfareType = mk(5, (i) => ({ id: 7 + i, name: pick(['助学', '助老', '助残', '环保', '救灾'], i), sort: i, imgUrl: IMG('公益分类', i, 200, 200) }));

const welfareActivity = mk(8, (i) => ({
  id: i,
  imgUrl: IMG('公益活动', i, 640, 400),
  typeId: 7 + (i % 5),
  typeName: pick(['助学', '助老', '助残', '环保'], i),
  name: pick(['山区儿童助学计划', '孤寡老人关爱行动', '残疾人技能培训', '城市绿化认养', '乡村小学图书角'], i),
  author: pick(['市慈善总会', '刘零二', '青年志愿者协会'], i),
  activityAt: `2026-11-${String(10 + i).padStart(2, '0')}`,
  moneyTotal: 50000 + i * 10000,
  moneyNow: 20000 + i * 5000,
  description: '本项目所筹善款将全部用于受助对象，收支明细定期公示，接受社会监督。',
  isRecommend: i <= 3 ? '1' : '0',
  donateCount: 10 + i * 7,
  detailsList: null,
}));

const donateRecord = mk(5, (i) => ({
  id: i,
  activityId: 1 + (i % 4),
  activityName: pick(['山区儿童助学计划', '孤寡老人关爱行动'], i),
  userId: 2,
  userName: 'test02',
  money: pick([100, 50, 200, 20, 500], i),
  createTime: D(21 - i, '11:20:00'),
  isAnonymous: i === 2 ? '1' : '0',
  payType: '电子支付',
}));

/* ---------------------------------------------------------------- 物流查询 */
const logisticsCompany = mk(8, (i) => ({
  id: i,
  name: pick(['申通物流', '圆通物流', '中通快递', '顺丰速运', '韵达快递', '京东物流', 'EMS', '德邦物流'], i),
  sort: i,
  imgUrl: IMG('物流公司', i, 240, 240),
  introduce: '公司成立于 1993 年，致力于民族品牌的建设和发展，不断完善终端网络、中转运输网络和信息网络。',
  shippingMethod: '陆运/空运',
  phone: '1884242424' + i,
  website: 'https://www.example.com',
}));

const logisticsInfo = {
  infoNo: 'ST0000001',
  companyId: 1,
  companyName: '申通物流',
  company: { id: 1, name: '申通物流', imgUrl: IMG('物流公司', 1, 240, 240), phone: '18842424241', website: 'https://www.example.com', introduce: '申通快递品牌初创于 1993 年，致力于民族品牌的建设和发展。' },
  state: '运输中',
  sender: '王先生',
  senderPhone: '13800000000',
  receiver: '李女士',
  receiverPhone: '13900000000',
  sendAddress: '辽宁省大连市甘井子区软件园路 1 号',
  receiveAddress: '辽宁省沈阳市和平区青年大街 100 号',
  list: [
    { id: 6, infoNo: 'ST0000001', context: '快件已到达【沈阳转运中心】', time: D(22, '08:12:00'), status: '运输中' },
    { id: 5, infoNo: 'ST0000001', context: '快件已从【大连转运中心】发出', time: D(21, '22:40:00'), status: '运输中' },
    { id: 4, infoNo: 'ST0000001', context: '快件已到达【大连转运中心】', time: D(21, '18:05:00'), status: '运输中' },
    { id: 3, infoNo: 'ST0000001', context: '【大连市甘井子区公司】已揽收', time: D(21, '14:30:00'), status: '已揽收' },
    { id: 2, infoNo: 'ST0000001', context: '快件已打包，等待揽收', time: D(21, '13:10:00'), status: '待揽收' },
    { id: 1, infoNo: 'ST0000001', context: '订单已创建', time: D(21, '13:00:00'), status: '已下单' },
  ],
};

const logisticsComplaint = mk(4, (i) => ({
  id: i,
  companyId: 1 + i,
  userId: 2,
  infoNo: 'ST000000' + i,
  questionType: String(1 + (i % 3)),
  questionTypeName: pick(['快递延误', '包裹破损', '服务态度'], i),
  description: '帮我看看这个快递到底是怎么回事，谢谢。',
  createTime: D(21 - i, '15:21:58'),
  state: '1',
  stateName: '处理中',
  company: { id: 1 + i, name: logisticsCompany[i].name, sort: i, imgUrl: logisticsCompany[i].imgUrl },
}));

/* ---------------------------------------------------------------- 宠物医院 */
const petType = mk(6, (i) => ({ id: 9 + i, name: pick(['小猫咪', '小狗', '兔子', '仓鼠', '鹦鹉', '乌龟'], i), imgUrl: IMG('宠物', i, 240, 240), sort: i }));

const petDoctor = mk(6, (i) => ({
  id: 9 + i,
  typeId: 9 + (i % 6),
  typeName: pick(['小猫咪', '小狗'], i),
  name: pick(['王医生', '李医生', '张医生'], i),
  avatar: AV('宠物医生'),
  jobName: pick(['主任医师', '副主任医师', '主治医师'], i),
  practiceNo: 'SK000000' + i,
  workingYears: 3 + i * 2,
  goodAt: pick(['治疗小猫咪不睡觉', '犬类皮肤病诊治', '宠物营养与保健'], i),
  hospital: '大连市宠物医院',
  score: 4 + (i % 10) / 10,
  serviceTimes: 100 + i * 30,
  introduction: '从事小动物临床诊疗工作多年，擅长内科与皮肤科疾病诊治。',
}));

const inquiry = mk(4, (i) => ({
  id: i,
  doctorId: 9 + (i % 6),
  doctorName: pick(['王医生', '李医生'], i),
  doctor: {
    id: 9 + (i % 6),
    name: pick(['王医生', '李医生'], i),
    avatar: AV('宠物医生'),
    jobName: '主任医师',
    workingYears: 8 + i,
    goodAt: '小动物内科与皮肤科',
    hospital: '大连市宠物医院',
  },
  userId: 2,
  petTypeId: 9 + (i % 6),
  petTypeName: pick(['小猫咪', '小狗'], i),
  question: pick(['我们家小猫一年没睡觉了，怎么办？', '狗狗最近食欲不振，精神也不好。', '猫咪身上起了红点，是什么原因？'], i),
  imageUrls: IMG('问诊图片', i, 400, 300),
  createTime: D(21 - i, '09:30:00'),
  state: '1',
  stateName: pick(['待回复', '已回复', '已结束'], i),
  replyContent: '建议先观察饮食与排泄情况，必要时到院做血常规检查。',
}));

const inquiryMessage = mk(8, (i) => ({
  id: i,
  inquiryId: 1 + (i % 4),
  senderType: i % 2 === 0 ? '1' : '2',
  senderName: i % 2 === 0 ? 'test02' : '王医生',
  content: pick(['医生您好，小猫最近不怎么吃东西。', '你好，请问持续几天了？', '大概三天了，精神还可以。', '建议先测量体温，注意补水。'], i),
  createTime: D(21 - i, '09:3' + (i % 10) + ':00'),
  avatar: AV('用户'),
}));

/* ---------------------------------------------------------------- 厨房助手 */
const kitchenDishes = mk(20, (i) => ({
  id: i,
  name: pick(['红烧肉', '宫保鸡丁', '番茄炒蛋', '麻婆豆腐', '清蒸鲈鱼', '可乐鸡翅', '鱼香肉丝', '糖醋排骨', '蒜蓉西兰花', '酸辣土豆丝'], i),
  imgUrl: IMG('菜品', i, 500, 400),
  introduction: '家常经典菜式，做法简单，老少皆宜。',
  material: '主料：猪肉 500g；辅料：葱姜蒜、生抽、老抽、冰糖、料酒。',
  practice: '1、五花肉切块冷水下锅焯水；2、热锅冷油下冰糖炒糖色；3、下肉块翻炒上色，加调料与热水；4、小火炖 40 分钟收汁即可。',
  type: pick(['荤菜', '素菜', '汤羹', '主食'], i),
  likes: 50 + i * 17,
  collections: 20 + i * 9,
  createTime: D(20 - i % 20),
  isLike: false,
  isCollection: false,
}));

const kitchenKeyword = mk(6, (i) => ({ id: i, keyword: pick(['红烧', '清蒸', '凉拌', '汤', '快手菜', '下饭菜'], i), searchTimes: 30 - i * 3 }));

const kitchenCollection = mk(5, (i) => ({
  id: i,
  userId: 2,
  dishesId: 1 + i * 3,
  dishesName: pick(['红烧肉', '宫保鸡丁', '麻婆豆腐'], i),
  dishesImg: IMG('菜品', 1 + i * 3, 300, 300),
  createTime: D(20 - i),
}));

/* ---------------------------------------------------------------- 汇总 */
export const db = {
  // 通用
  user: { userId: 2, userName: 'test02', nickName: '测试用户02', email: 'test02@example.com', phonenumber: '13800000000', sex: '0', avatar: '', idCard: '210211199909090014', balance: 9800, score: 10000, createTime: '2026-01-01 00:00:00' },
  press,
  pressCategory: pressTypes,
  pressComment,
  rotation,
  service,
  balance,
  feedback,
  allorder: mk(10, (i) => ({
    id: i,
    orderNo: '20261010010618852' + (20 + i),
    amount: pick([58, 64, 3, 100, 45], i),
    orderStatus: i <= 3 ? '未付款' : '已付款',
    userId: 2,
    payTime: `2026-10-${String(21 - i).padStart(2, '0')}`,
    name: pick(['中影华臣影城', '国际大厦停车场', '1 号线地铁', '电费缴纳', '皖北刘哥牛肉板面'], i),
    orderType: pick(['movie', 'park', 'metro', 'living', 'takeout'], i),
    createTime: D(21 - i),
  })),
  weather: { maxTemperature: '22', minTemperature: '12', temperature: '18', weather: '晴', humidity: '60', air: '优', apparentTemperature: '17', uv: '弱', wind: '东北风 3 级', city: '大连市', updateTime: '2026-10-22 08:00:00', week: '星期四' },
  dict: {
    sys_yes_no: [{ dictLabel: '是', dictValue: 'Y' }, { dictLabel: '否', dictValue: 'N' }],
    order_status: [{ dictLabel: '未支付', dictValue: '0' }, { dictLabel: '已支付', dictValue: '1' }],
    adv_type: [{ dictLabel: '引导页轮播', dictValue: '1' }, { dictLabel: '主页轮播', dictValue: '2' }],
    car_type: [{ dictLabel: '汽油车', dictValue: '汽油车' }, { dictLabel: '新能源车', dictValue: '新能源车' }],
    film_category: [{ dictLabel: '故事', dictValue: '1' }, { dictLabel: '爱情', dictValue: '2' }, { dictLabel: '动作', dictValue: '3' }, { dictLabel: '喜剧', dictValue: '4' }, { dictLabel: '恐怖', dictValue: '5' }, { dictLabel: '惊悚', dictValue: '6' }, { dictLabel: '战争', dictValue: '7' }, { dictLabel: '科幻', dictValue: '8' }],
    tk_order_status: [{ dictLabel: '待评价', dictValue: '待评价' }, { dictLabel: '完成', dictValue: '完成' }],
    balance_log_type: [{ dictLabel: '收入', dictValue: '收入' }, { dictLabel: '支出', dictValue: '支出' }],
    function_type: [{ dictLabel: '生活服务', dictValue: '生活服务' }, { dictLabel: '车主服务', dictValue: '车主服务' }],
  },

  // 停哪儿
  'park/lot': parkLot,
  'park/lot/record': parkLotRecord,
  'park/car': parkCar,
  'park/car/consumption': carConsumption,
  'park/car/history': parkLotRecord,
  'park/product': parkProduct,
  'park/score': balance,
  'park/score/level': scoreLevel,
  'park/score/notice': press.slice(0, 4),
  'park/score/top': mk(6, (i) => ({ id: i, userName: pick(['小明', '阿伟', '甜甜'], i), score: 9000 - i * 500, avatar: AV('用户') })),
  'park/rotation': rotation,
  'park/recharge': balance,
  'park/press': press,
  'park/press/category': pressTypes,
  'park/press/comments': pressComment,
  'park/feedback': feedback,

  // 地铁
  'metro/city': metroCity,
  'metro/line': metroLine,
  'metro/list': metroCity,
  'metro/step': metroStep,
  'metro/notice': metroNotice,
  'metro/found': metroFound,
  'metro/card': metroCard,
  'metro/record': metroRecord,
  'metro/statement': mk(4, (i) => ({ id: i, title: pick(['乘车须知', '票务规则', '安全提示', '乘客守则'], i), content: '为保障乘客安全出行，请遵守以下规定。', createTime: D(20 - i), type: '1' })),
  'metro/rotation': rotation,
  'metro/press': press,
  'metro/press/category': pressTypes,
  'metro/press/comments': pressComment,
  'metro/feedback': feedback,

  // 外卖
  'takeout/theme': takeoutTheme,
  'takeout/seller': takeoutSeller,
  'takeout/category': takeoutCategory,
  'takeout/product': takeoutProduct,
  'takeout/address': takeoutAddress,
  'takeout/order': takeoutOrder,
  'takeout/comment': takeoutComment,
  'takeout/collect': mk(4, (i) => ({ id: i, userId: 2, sellerId: i, sellerName: takeoutSeller[i - 1].name, imgUrl: takeoutSeller[i - 1].imgUrl, score: takeoutSeller[i - 1].score, deliveryTime: takeoutSeller[i - 1].deliveryTime, createTime: D(20 - i) })),
  'takeout/rotation': rotation,
  'takeout/feedback': feedback,
  'takeout/search': takeoutSeller,

  // 找工作
  'job/company': jobCompany,
  'job/post': jobPost,
  'job/profession': profession,
  'job/deliver': mk(4, (i) => ({ id: i, userId: 2, postId: 1 + i, companyId: 1 + i, companyName: jobCompany[i - 1].companyName, money: pick(['4000', '8000', '12000'], i), satrTime: `2026-09-${String(10 + i).padStart(2, '0')}`, userName: 'test02', postName: jobPost[i - 1].name, state: pick(['已投递', '已查看', '邀请面试'], i) })),
  'job/resume': [{ id: 1, mostEducation: '博士', education: '本科', address: '大连', experience: '1 年', individualResume: '性格开朗、乐观上进、有爱心；对待工作认真负责，善于沟通协调，有较强的组织能力与团队精神；上进心强、勤于学习，能不断提升自身能力与综合素质。', money: '7000', positionId: 2, files: '', userId: 2, name: '王大卫', phone: '13800000000' }],

  // 找房子
  'house/housing': house,

  // 智慧交管
  'traffic/car': trafficCar,
  'traffic/illegal': trafficIllegal,
  'traffic/illegal/notice': trafficNotice,
  'traffic/checkCar/place': checkPlace,
  'traffic/checkCar/apply': mk(3, (i) => ({ id: i, userId: 2, carId: 1 + i, aptTime: `2026-11-0${i + 2} 10:29:02`, addressId: 1 + i, placeName: checkPlace[i - 1].placeName, status: pick(['待审核', '已通过', '已完成'], i), createTime: D(20 - i) })),
  'traffic/checkCar': {
    id: 1,
    title: '机动车安全技术检验须知',
    notice: '<p><strong>一、检验周期</strong></p><p>非营运小型客车 6 年内每 2 年检验一次，超过 6 年每年检验一次，超过 15 年每半年检验一次。</p><p><strong>二、所需材料</strong></p><p>机动车行驶证原件、交强险凭证、车主身份证原件。</p><p><strong>三、注意事项</strong></p><p>请提前处理完毕交通违法记录，保持车辆外观与登记信息一致，随车携带三角警示牌。</p>',
    createTime: '2026-01-05 09:00:00',
    updateTime: '2026-09-01 10:20:00',
  },
  'traffic/license': [trafficLicense],
  'traffic/feedback': feedback,
  'traffic/rotation': rotation,
  'traffic/illegal/apply': mk(3, (i) => ({ id: i, illegalId: i, userId: 2, applyType: '申诉', content: '当时因避让救护车，请求撤销处罚。', state: '申请中', createTime: D(20 - i) })),

  // 活动
  'activity/category': activityCategory,
  'activity/activity': activity,
  'activity/comment': activityComment,
  'activity/rotation': rotation,
  'activity/signup': mk(3, (i) => ({ id: i, activityId: i, userId: 2, userName: 'test02', signupTime: D(20 - i), state: '1' })),

  // 生活交费
  'living/category': livingCategory,
  'living/bill': livingBill,
  'living/account': livingAccount,
  'living/phone': [{ id: 1, phonenumber: '13800000000', balance: 20, operator: '中国移动', userId: 2 }],
  'living/phone/record': phoneRecord,
  'living/phone/rule': phoneRule,
  'living/recharge/record': phoneRecord,
  'living/press': livingPress,
  'living/press/category': pressTypes,
  'living/press/comments': pressComment,
  'living/rotation': rotation,
  'living/feedback': feedback,

  // 电影
  'movie/film': film,
  'movie/film/preview': film.map((f) => ({ id: f.id, name: f.name, cover: f.cover, video: '', duration: 120, introduction: f.introduction })),
  'movie/film/comment': filmComment,
  'movie/theatre': theatre,
  'movie/theatre/room': room,
  'movie/theatre/seat': seats,
  'movie/theatre/times': times,
  'movie/ticket/order': ticketOrder,
  'movie/rotation': rotation,
  'movie/press': moviePress,
  'movie/press/category': pressTypes,
  'movie/press/comments': pressComment,
  'movie/feedback': feedback,

  // 门诊
  'hospital/hospital': hospital,
  'hospital/banner': mk(4, (i) => ({ id: i, imgUrl: IMG('医院横幅', i, 750, 320), hospitalId: 1 + (i % 3) })),
  'hospital/category': hospitalCategory,
  'hospital/patient': patient,
  'hospital/reservation': reservation,

  // 巴士
  'bus/stop': busStops,
  'bus/line': busLine,
  'bus/order': busOrder,

  // 政务热线
  'gov-service-hotline/appeal-category': appealCategory,
  'gov-service-hotline/appeal': appeal,
  'gov-service-hotline/appeal/my': appeal,
  'gov-service-hotline/ad-banner': rotation,

  // 法律
  'lawyer-consultation/legal-expertise': expertise,
  'lawyer-consultation/lawyer': lawyer,
  'lawyer-consultation/legal-advice': legalAdvice,
  'lawyer-consultation/ad-banner': rotation,

  // 志愿
  'volunteer-service/news': volunteerNews,
  'volunteer-service/activity': volunteerActivity,
  'volunteer-service/ad-banner': rotation,

  // 图书馆
  'digital-library/library': library,
  'digital-library/library-comment': libraryComment,

  // 垃圾分类
  'garbage-classification/news-type': garbageNewsType,
  'garbage-classification/news': garbageNews,
  'garbage-classification/garbage-classification': garbageClass,
  'garbage-classification/garbage-example': garbageExample,
  'garbage-classification/poster': poster,
  'garbage-classification/ad-banner': rotation,
  'garbage-classification/news-comment': pressComment,

  // 青年驿站
  'youth-inn/talent-policy-area': youthArea,
  'youth-inn/talent-policy': youthPolicy,
  'youth-inn/youth-inn': youthInn,

  // 公益
  'public-welfare/public-welfare-type': welfareType,
  'public-welfare/public-welfare-activity': welfareActivity,
  'public-welfare/donate-record': donateRecord,
  'public-welfare/ad-banner': rotation,

  // 物流
  'logistics-inquiry/logistics_company': logisticsCompany,
  'logistics-inquiry/logistics_complaint': logisticsComplaint,
  'logistics-inquiry/ad-banner': rotation,
  logisticsInfo,

  // 宠物
  'pet-hospital/pet-type': petType,
  'pet-hospital/pet-doctor': petDoctor,
  'pet-hospital/inquiry': inquiry,
  'pet-hospital/inquiry-message': inquiryMessage,

  // 厨房
  'kitchen-helper/dishes': kitchenDishes,
  'kitchen-helper/dishes/hot-keywords': kitchenKeyword,
  'kitchen-helper/dishes-collection': kitchenCollection,
  'kitchen-helper/dishes-like': mk(5, (i) => ({ id: i, userId: 2, dishesId: 1 + i, createTime: D(20 - i) })),
};

export const tasks = [];
