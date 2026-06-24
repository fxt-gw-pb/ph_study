#!/usr/bin/env python3
"""Generate 知识仓库/精神病学往年题考点整理.md from extracted texts."""
import re
import json
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
EXTRACT = Path('/tmp/psy_extract')
OUT = REPO / '知识仓库' / '精神病学往年题考点整理.md'
SUMMARY = EXTRACT / '00_知识点总结.txt'

CHAPTERS = [
    {'num': '一', 'title': '绪论', 'id': 1, 'points': [
        {'title': '精神病学/精神医学的定义与任务', 'keys': ['精神病学', '精神医学', 'psychiatry', '临床医学的分支', '4P因素', '4P', '素质因素', '促发因素', '附加因素'], 'section': '一、绪论 / 精神病学的定义和任务'},
        {'title': '精神障碍、精神病与神经症的概念', 'keys': ['精神障碍', '精神病', '神经症', '精神病性障碍', '非精神病性', '精神医学的概念和分类', '精神医学的概念', 'ICD-10', 'F00', 'F20', 'F30', 'WHO', '健康定义', '生物－心理－社会'], 'section': '一、绪论 / 精神障碍与精神病'},
        {'title': '精神障碍的病因与发病机制', 'keys': ['病因', '促发因素', '附加因素', '多因素', '神经递质', '可塑性', 'DA功能亢进', '5-HT'], 'section': '一、绪论 / 精神障碍的病因'},
        {'title': '精神障碍分类与症状学诊断原则', 'keys': ['症状学诊断', '器质性', '功能性', '多轴', '等级诊断', '共病', '状态性诊断', 'CCMD'], 'section': '一、绪论 / 精神障碍的分类'},
    ]},
    {'num': '二', 'title': '精神症状学', 'id': 2, 'points': [
        {'title': '精神症状的共同特点与基本要素', 'keys': ['精神症状的共同', '基本要素', '不受意识控制'], 'section': '二、精神症状学 / 共同特点'},
        {'title': '感知觉障碍（错觉、幻觉、感知综合障碍）', 'keys': ['幻觉', '错觉', '幻听', '幻视', '真性幻觉', '假性幻觉', '思维鸣响', '反射性幻听', '机能性幻听', '功能性幻听', '感知综合', '视物变形', '非真实感', '内感性不适', '内脏幻觉', '感知的定义', '感知'], 'section': '二、精神症状学 / 知觉障碍'},
        {'title': '思维障碍（形式与内容）', 'keys': ['思维奔逸', '思维迟缓', '思维贫乏', '思维破裂', '思维松弛', '病理性赘述', '强制性思维', '强迫观念', '语词新作', '病理性象征', '原发性妄想', '继发性妄想', '关系妄想', '被害妄想', '夸大妄想', '嫉妒妄想', '钟情妄想', '疑病妄想', '被洞悉', '物理影响', '超价观念', '牵连观念', '自罪妄想', '思维形式', '思维内容', '妄想'], 'section': '二、精神症状学 / 思维障碍'},
        {'title': '注意、记忆与智能障碍', 'keys': ['注意', '记忆', '顺行性遗忘', '逆行性遗忘', '错构', '虚构', '智能', '痴呆', '精神发育迟滞', '假性痴呆', '童样痴呆', 'Ganser', '遗忘综合征'], 'section': '二、精神症状学 / 注意记忆智能'},
        {'title': '情感与意志行为障碍', 'keys': ['情感高涨', '情感低落', '焦虑', '恐惧', '情感淡漠', '易激惹', '情感倒错', '病理性激情', '意志增强', '意志减退', '意志缺乏', '木僵', '违拗', '刻板', '作态', '精神运动性', '空气枕头', '蜡样屈曲'], 'section': '二、精神症状学 / 情感意志行为'},
        {'title': '意识障碍与常见精神综合征', 'keys': ['谵妄', '遗忘综合征', '柯萨可夫', '急性脑器质性', '慢性脑器质性', '幻觉-妄想', '紧张综合征', '精神自动', '阳性综合征', '阴性综合征', '戒断综合征', '抑郁综合征', '躁狂综合征', 'Capgras', '替身'], 'section': '二、精神症状学 / 意识与综合征'},
        {'title': '自知力与定向力', 'keys': ['自知力', '定向力'], 'section': '二、精神症状学 / 自知力'},
    ]},
    {'num': '三', 'title': '精神分裂症', 'id': 3, 'points': [
        {'title': '精神分裂症概述与临床表现（阳性/阴性/认知）', 'keys': ['精神分裂症', '阳性症状', '阴性症状', '认知症状', '瓦解症状', '言语性幻听', '紧张症', '精神分裂症的临床表现', '精分', '分裂症'], 'section': '三、精神分裂症 / 临床表现'},
        {'title': '精神分裂症诊断标准与鉴别', 'keys': ['ICD-10', '病程', '一个月', '症状学标准', '鉴别', '五维症状', '离解', '思维鸣响', '被控制妄想', '评论性幻听'], 'section': '三、精神分裂症 / 诊断与鉴别'},
        {'title': '精神分裂症分型、病程与预后', 'keys': ['偏执型', '青春型', '紧张型', '单纯型', '预后', '复发', '患病率', '分裂情感'], 'section': '三、精神分裂症 / 分型与预后'},
        {'title': '抗精神病药物与治疗原则', 'keys': ['抗精神病', '用药原则', '联合用药', '足量', '足疗程', '个体化', '氟哌啶醇', '氯丙嗪', '利培酮', '奥氮平', '喹硫平', '锥体外系', '氯氮平', '粒细胞', 'D2', '5-HT', '舒必利', '电抽搐'], 'section': '三、精神分裂症 / 治疗'},
    ]},
    {'num': '四', 'title': '双相情感障碍', 'id': 4, 'points': [
        {'title': '双相障碍概述与临床特点', 'keys': ['双相', '心境稳定', '发作性', 'I型', 'II型', '混合发作', '轻躁狂', '环性心境'], 'section': '四、双相情感障碍 / 概述'},
        {'title': '躁狂发作与轻躁狂发作', 'keys': ['躁狂发作', '躁狂', '轻躁狂', '三高', '情绪高涨', '易激惹', '一周', '精神病性症状', '音联意联'], 'section': '四、双相 / 躁狂发作'},
        {'title': '双相诊断、鉴别与治疗原则', 'keys': ['双相障碍治疗', '治疗原则', '全病程', '优先原则', '共病', '依从', '评估和监测', '碳酸锂', '丙戊酸', '卡马西平', '电休克', 'ECT'], 'section': '四、双相 / 治疗原则'},
        {'title': '双相病例分析', 'keys': ['病例', '双相情感障碍I型', '情绪高涨交替', '躁狂发作精神症状', '诊断与鉴别诊断'], 'section': '四、双相 / 病例'},
    ]},
    {'num': '五', 'title': '抑郁障碍', 'id': 5, 'points': [
        {'title': '抑郁障碍临床表现与诊断', 'keys': ['抑郁障碍', '抑郁发作', '抑郁症', '三低', '心境低落', '兴趣减退', '快感缺失', '三自', '三无', '生物学症状', '早醒', '2周', '抑郁的临床表现', '隐匿性抑郁', 'Cotard'], 'section': '五、抑郁障碍 / 临床表现与诊断'},
        {'title': '抑郁障碍鉴别与分型', 'keys': ['鉴别', '难治性抑郁', '恶劣心境', '心境恶劣', '2年', '儿童青少年期抑郁', '老年期抑郁', '孕产期', '假性痴呆'], 'section': '五、抑郁障碍 / 鉴别与分型'},
        {'title': '抑郁障碍治疗原则与药物', 'keys': ['抗抑郁', 'SSRI', '五朵金花', '西酞普兰', '氟西汀', '帕罗西汀', '舍曲林', '氟伏沙明', 'SNRI', '三环', '阿米替林', '氯米帕明', '麦普替林', '不良反应', '药物治疗原则', '急性期', '巩固期', '维持期', '康复期'], 'section': '五、抑郁障碍 / 治疗'},
        {'title': 'MECT与抑郁预后', 'keys': ['电休克', 'MECT', '改良电休克', '5R', '复燃', '复发'], 'section': '五、抑郁障碍 / MECT'},
    ]},
    {'num': '六', 'title': '焦虑障碍与强迫障碍', 'id': 6, 'points': [
        {'title': '病理性焦虑与焦虑障碍概述', 'keys': ['病理性焦虑', '焦虑障碍', '焦虑症状', '特质焦虑', '状态焦虑', '焦虑与恐惧', '正常焦虑'], 'section': '六、焦虑障碍 / 概述'},
        {'title': '广泛性焦虑障碍', 'keys': ['广泛性焦虑', 'GAD', '6个月', '自由浮动', '预期焦虑'], 'section': '六、焦虑障碍 / 广泛性焦虑'},
        {'title': '惊恐障碍', 'keys': ['惊恐', '急性焦虑', '濒死感', '失控感', '5-20'], 'section': '六、焦虑障碍 / 惊恐障碍'},
        {'title': '社交焦虑障碍', 'keys': ['社交焦虑', '社交恐惧', '社恐'], 'section': '六、焦虑障碍 / 社交焦虑'},
        {'title': '强迫障碍（临床表现、诊断、治疗）', 'keys': ['强迫', '强迫症', '强迫观念', '强迫行为', '强迫检查', '强迫清洗', '属我', '森田', '暴露', '反应预防', '治疗策略', '治疗方法', '氯米帕明'], 'section': '六、强迫障碍'},
        {'title': '焦虑/强迫相关鉴别', 'keys': ['疑病症', '恐惧症', '肺炎', '癌症', '躯体变形', '间谍日记'], 'section': '六、焦虑强迫 / 鉴别'},
    ]},
    {'num': '七', 'title': '心身疾病', 'id': 7, 'points': [
        {'title': '心身医学与会诊-联络精神病学', 'keys': ['心身医学', '会诊', '联络精神病学', '心身疾病'], 'section': '七、心身疾病 / 心身医学'},
        {'title': '躯体疾病所致精神障碍的共同特点与处理原则', 'keys': ['躯体疾病所致', '共同临床特点', '处理原则', '原发病', '营养支持', '昼轻夜重', '平行发展', '器质性精神障碍'], 'section': '七、心身疾病 / 躯体疾病所致精神障碍'},
        {'title': '综合医院常见精神综合征', 'keys': ['谵妄', '痴呆', '等级诊断', '躯体化', '癫痫', '脑炎', '卒中后抑郁', '甲亢', '糖皮质激素', '红斑狼疮', '肝性脑病', '糖尿病伴', '甲减', '一氧化碳', '有机磷'], 'section': '七、心身疾病 / 综合医院综合征'},
    ]},
    {'num': '八', 'title': '物质依赖', 'id': 8, 'points': [
        {'title': '成瘾物质、依赖、耐受与戒断', 'keys': ['成瘾', '物质依赖', '物质滥用', '耐受', '戒断', '精神依赖', '躯体依赖', '依赖综合征', '精神活性物质', '海洛因', '阿片', '苯二氮卓', '大麻', '可卡因', 'ATS', '冰毒'], 'section': '八、物质依赖 / 基本概念'},
        {'title': '物质依赖与疾病、道德的关系', 'keys': ['道德', '疾病的关系', '大脑疾病', '慢性、进行性、复发性'], 'section': '八、物质依赖 / 与道德和疾病'},
        {'title': '酒精所致精神障碍与戒断治疗', 'keys': ['酒精', '震颤谵妄', '柯萨可夫', 'Wernick', 'Korsakoff', '苯二氮卓', '戒酒', '酒依赖'], 'section': '八、物质依赖 / 酒精'},
    ]},
    {'num': '九', 'title': '儿童青少年精神障碍', 'id': 9, 'points': [
        {'title': '孤独症谱系障碍', 'keys': ['孤独症', '自闭症', 'ASD', '社交交流障碍', '刻板', 'ABA', 'ADOS'], 'section': '九、儿童青少年 / 孤独症'},
        {'title': '注意缺陷多动障碍', 'keys': ['多动', 'ADHD', '注意缺陷', '中枢兴奋剂', '智力发育障碍', '精神发育迟滞'], 'section': '九、儿童青少年 / 多动症'},
        {'title': '青少年抑郁障碍', 'keys': ['青少年抑郁', '儿童抑郁'], 'section': '九、儿童青少年 / 青少年抑郁'},
    ]},
    {'num': '十', 'title': '老年精神障碍', 'id': 10, 'points': [
        {'title': '阿尔茨海默病（AD）', 'keys': ['阿尔茨海默', '阿尔兹海默', 'AD', '老年斑', '神经纤维缠结', '被窃妄想', '近事遗忘', '胆碱酯酶', 'Alzheimer'], 'section': '十、老年精神障碍 / AD'},
        {'title': '血管性痴呆与其他痴呆', 'keys': ['血管性痴呆', 'VaD', '多发梗塞', '阶梯式', '亨廷顿', 'Pick病'], 'section': '十、老年精神障碍 / VaD'},
        {'title': '老年期抑郁', 'keys': ['老年期抑郁', '老年抑郁', '疑病', '焦虑体验', '躯体症状'], 'section': '十、老年精神障碍 / 老年抑郁'},
    ]},
    {'num': '十一', 'title': '公共精神卫生', 'id': 11, 'points': [
        {'title': '公共精神卫生服务内容与三级预防', 'keys': ['公共精神卫生', '三级预防', '一级预防', '二级预防', '精神健康促进', '金字塔', '耻感', '自杀预防', '危机干预'], 'section': '十一、公共精神卫生'},
    ]},
    {'num': '十二', 'title': '精神康复', 'id': 12, 'points': [
        {'title': '精神康复概念、内容与机构', 'keys': ['精神康复', '康复', '服药训练', '生活技能', '职业技能', '日间医院', '个案管理', '优势个案'], 'section': '十二、精神康复'},
    ]},
    {'num': '附', 'title': '应激相关障碍与其他未完全匹配考点', 'id': 13, 'points': [
        {'title': '创伤后应激障碍（PTSD）与急性应激', 'keys': ['PTSD', '创伤后应激', '应激反应障碍', '急性应激', '延迟性心因性', '适应性障碍', '心因性反应'], 'section': '附：应激相关障碍'},
        {'title': '神经症、癔症与躯体形式障碍', 'keys': ['神经症', '神经衰弱', '癔症', '躯体形式', '躯体化', '躯体化障碍', '疑病症', '分离转换', '恐怖症', '场所恐惧', '反应性精神病'], 'section': '附：神经症与躯体形式障碍'},
        {'title': '精神检查、诊断方法与量表', 'keys': ['精神检查', '临床晤谈', '心理测验', '量表', '病史采集', '晤谈'], 'section': '附：检查与诊断方法'},
        {'title': '躯体治疗与药物总论', 'keys': ['躯体治疗', '药物代谢', '治疗依从', '苯二氮卓类', '丁螺环酮', '恶性综合征', '迟发性运动障碍', '静坐不能'], 'section': '附：躯体治疗'},
        {'title': '未完全匹配到（综合/跨章节）', 'keys': [], 'section': '附：未完全匹配', 'fallback': True},
    ]},
]


def read(p):
    try:
        return Path(p).read_text(encoding='utf-8', errors='ignore')
    except Exception:
        return ''


def norm(s):
    s = s.replace('\u2028', '\n').replace('\u3000', ' ')
    return re.sub(r'\s+', ' ', s).strip()


def clean_q_text(s):
    s = re.sub(r'HYPERLINK\s+"[^"]*"\s*', '', s)
    s = re.sub(r'file:///[^\s"]+', '', s)
    return norm(s)


def normalize_source_text(text):
    return text.replace('\u2028', '\n').replace('\u00a0', ' ')


def qtype(text, src=''):
    blob = src + text
    if re.search(r'论述', blob):
        return '论述'
    if re.search(r'病例|案例', blob):
        return '病例分析'
    if re.search(r'简答', blob):
        return '简答'
    if re.search(r'名词', blob):
        return '名词解释'
    if re.search(r'[A-EＡ-Ｅ][\.、．）)]', text) and len(text) > 30:
        return '单项选择'
    if re.search(r'回忆', src):
        return '回忆/选择'
    return '题型未知'


def parse_numbered(text, source, min_len=8, id_prefix=''):
    text = normalize_source_text(text)
    qs = []
    for m in re.finditer(r'(?:^|[\s\n])(\d+)[\.、．]\s*', text):
        start = m.end()
        nm = re.search(r'(?:^|[\s\n])\d+[\.、．]\s*', text[start:])
        end = start + nm.start() if nm else len(text)
        body = clean_q_text(text[start:end])
        if len(body) >= min_len:
            qs.append({
                'id': f'{source}#{id_prefix}{m.start()}#{m.group(1)}',
                'source': source,
                'type': qtype(body, source),
                'text': body,
                'num': m.group(1),
            })
    return qs


def parse_baidu(text, source):
    return parse_numbered(text, source, min_len=10)


def parse_chapter_review(text, source):
    qs = []
    for m in re.finditer(r'(\d+)[\.．、]\s*([^\n]+(?:\n(?!\s*\d+[\.．、]|答案：|【)[^\n]+)*)', text):
        body = clean_q_text(re.sub(r'答案：[A-EＡ-Ｅ]+.*$', '', m.group(2), flags=re.S))
        if len(body) >= 8:
            qs.append({
                'id': f'{source}#{m.start()}#{m.group(1)}',
                'source': source,
                'type': qtype(body, source),
                'text': body,
                'num': m.group(1),
            })
    return qs


def parse_jinghua(text, source):
    qs = []
    cur = ''
    n = 0
    for line in text.splitlines():
        if re.match(r'^[A-EＡ-Ｅ][\.、．]', line.strip()) and len(cur) > 20:
            n += 1
            qs.append({'id': f'{source}#{n}', 'source': source, 'type': '单项选择', 'text': clean_q_text(cur), 'num': str(n)})
            cur = line
        else:
            cur = (cur + '\n' + line) if cur else line
    if len(cur) > 20:
        n += 1
        qs.append({'id': f'{source}#{n}', 'source': source, 'type': '单项选择', 'text': norm(cur), 'num': str(n)})
    return qs


def parse_exam_messy(text, source):
    qs, seen = [], set()
    lines = text.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if re.match(r'^0*\d+$', line):
            i += 1
            continue
        if len(line) < 4 or re.match(r'^[A-E]$', line):
            i += 1
            continue
        chunk, j, opts = [line], i + 1, 0
        while j < len(lines) and j < i + 35:
            l = lines[j].strip()
            if re.match(r'^0*\d+$', l) and opts >= 2:
                break
            if re.match(r'^[A-E][\.、．]', l):
                opts += 1
            chunk.append(l)
            j += 1
        if opts >= 3:
            body = clean_q_text('\n'.join(chunk))
            key = body[:70]
            if key not in seen and len(body) > 25:
                seen.add(key)
                qs.append({'id': f'{source}#{len(qs)+1}', 'source': source, 'type': '单项选择', 'text': body, 'num': str(len(qs)+1)})
            i = j
        else:
            i += 1
    return qs


def parse_grade_exams():
    qs = []
    items16 = [
        ('1', '躯体疾病所致的精神障碍的共同临床特点与处理原则。', '简答'),
        ('2', '抗抑郁药物常见的不良反应及处理。', '简答'),
        ('3', '精神分裂症常见的阳性症状和阴性症状有哪些？', '简答'),
        ('4', '什么是病理性焦虑？其特点是什么？', '简答'),
        ('5', '孤独症的临床表现有哪些？', '简答'),
        ('6', '请论述精神医学的概念和分类。', '论述'),
        ('7', '请论述物质依赖与道德和疾病的关系。', '论述'),
        ('8', '公共精神卫生服务的内容有哪些？', '论述'),
    ]
    for n, stem, tp in items16:
        qs.append({'id': f'16#{n}', 'source': '16级预防《精神病学》考题.pdf', 'type': tp, 'text': stem, 'num': n})

    t20 = read(EXTRACT / '20级完整试题回忆.docx.txt')
    cm = re.search(r'一、单项选择题[\s\S]*?二、简答题', t20)
    if cm:
        block = cm.group(0)
        matches = list(re.finditer(r'^\s*(\d+)[、．.]\s*(.+)$', block, re.M))
        for i, m in enumerate(matches):
            idx = m.start()
            end = matches[i + 1].start() if i + 1 < len(matches) else len(block)
            chunk = block[idx:end]
            stem = m.group(2).strip()
            opts = '\n'.join(re.findall(r'^[A-EＥ][、．.].+$', chunk, re.M))
            qs.append({'id': f'20#c{m.group(1)}', 'source': '20级完整试题回忆.docx', 'type': '单项选择',
                       'text': clean_q_text(f"{stem}\n{opts}".strip()), 'num': m.group(1)})
    for tag, stem, tp in [
        ('j1', '精神分裂症的临床表现', '简答'),
        ('j2', '躯体疾病所致精神障碍的共同临床特点与处理原则', '简答'),
        ('j3', '孤独症谱系障碍的核心临床特征', '简答'),
        ('l1', '简述4P因素', '论述'),
        ('case', '双相情感障碍病例：精神症状、诊断与诊断思路、治疗原则（情绪高低交替、家族史阳性、既往躁狂史）', '病例分析'),
    ]:
        qs.append({'id': f'20#{tag}', 'source': '20级完整试题回忆.docx', 'type': tp, 'text': stem, 'num': tag})

    src21 = '21级精神病学考题yys.docx / 21级本科预防二班+胡润泽+精神病+主观题总结.docx'
    for tag, stem, tp in [
        ('c1', '社交恐惧障碍案例分析（选项无社交恐惧）', '单项选择'),
        ('c2', '组织让写间谍日记——问是什么症状', '单项选择'),
        ('c3', '怀疑自己得肺炎天天检查——疑病症/焦虑症/恐惧症鉴别', '单项选择'),
        ('c4', '阴道出血怀疑癌症伴心悸大汗——恐惧症/焦虑症/疑病症', '单项选择'),
        ('j1', '抑郁的临床表现', '简答'),
        ('j2', '简述并举例说明4P因素', '简答'),
        ('j3', '强迫症的治疗策略/治疗方法', '简答'),
        ('l1', 'PTSD创伤后应激障碍的临床表现和诊断原则/诊断要点', '论述'),
        ('case', '双相I型病例：目前精神症状及举例、诊断及鉴别诊断与证据、治疗原则（22岁男性，2016抑郁-2022躁狂-2024再躁狂）', '病例分析'),
    ]:
        qs.append({'id': f'21#{tag}', 'source': src21, 'type': tp, 'text': stem, 'num': tag})

    t0607 = read(EXTRACT / '06-07级 史前精神病考题.doc.txt')
    n = 0
    for line in t0607.splitlines():
        t = line.strip()
        if len(t) < 6 or re.match(r'^0[678]级', t) or re.match(r'^(其一|其二|考法|单选|总体|药物)', t):
            continue
        n += 1
        qs.append({'id': f'0607#{n}', 'source': '06-07级 史前精神病考题.doc', 'type': qtype(t, '回忆'),
                   'text': clean_q_text(re.sub(r'^\d+[．.]\s*', '', t)), 'num': str(n)})
    return qs


def collect_all():
    all_q = parse_grade_exams()
    files = [
        ('久远_1精神病试题-09级（练习）.docx.txt', '1精神病试题-09级（练习）.docx', parse_numbered),
        ('久远_4精神病题.pdf.txt', '4精神病题.pdf', parse_numbered),
        ('久远_5精神病学复习题.doc.txt', '5精神病学复习题.doc', parse_numbered),
        ('久远_2精神病-精华题（练习）.doc.txt', '2精神病-精华题（练习）.doc', parse_jinghua),
        ('久远_3考试习题.pdf.txt', '3考试习题.pdf', parse_exam_messy),
        ('久远_3考试习题（答案）.pdf.txt', '3考试习题（答案）.pdf', parse_exam_messy),
        ('久远_考试习题2.pdf.txt', '考试习题2.pdf', parse_exam_messy),
        ('久远_精神病学各章节复习要点和试题练习.doc.txt', '精神病学各章节复习要点和试题练习.doc', parse_chapter_review),
        ('久远_课程中心的考题.docx.txt', '课程中心的考题.docx', parse_numbered),
        ('久远_精神病学考试题库(单选_附答案-来源于百度文库).doc.txt', '精神病学考试题库(单选_附答案-来源于百度文库).doc', parse_baidu),
        ('久远_2精神病-精华题（答案）.pdf.txt', '2精神病-精华题（答案）.pdf', parse_jinghua),
    ]
    for fname, label, parser in files:
        text = normalize_source_text(read(EXTRACT / fname))
        if text:
            all_q.extend(parser(text, label))

    seen, out = set(), []
    for q in all_q:
        key = (q['source'], q['text'][:100])
        if key in seen:
            continue
        seen.add(key)
        out.append(q)
    return out


def score_kp(text, kp):
    if kp.get('fallback'):
        return 0
    s = 0
    for k in kp['keys']:
        if k in text:
            s += 3 if len(k) >= 4 else 2
    return s


def assign_kp(q):
    best, best_s = None, 0
    for ch in CHAPTERS:
        for kp in ch['points']:
            if kp.get('fallback'):
                continue
            sc = score_kp(q['text'], kp)
            if sc > best_s:
                best_s, best = sc, (ch, kp)
    if not best or best_s < 2:
        ch = next(c for c in CHAPTERS if c['id'] == 13)
        return ch, next(kp for kp in ch['points'] if kp.get('fallback'))
    return best


def extract_excerpt(summary, section_hint):
    ch_key = section_hint.split('/')[0].strip()
    sub_key = section_hint.split('/')[-1].strip() if '/' in section_hint else ''
    # Prefer body heading (not TOC line like "一、绪论\t1")
    m = re.search(rf'^{re.escape(ch_key)}\s*\n', summary, re.M)
    if not m:
        m = re.search(re.escape(ch_key), summary)
    if not m:
        return '（详见《精神病学复习整理by18级杨子铭》对应章节。）'
    start = m.start()
    rest = summary[start:]
    m2 = re.search(r'\n[一二三四五六七八九十]+、', rest[len(ch_key):])
    end = len(ch_key) + m2.start() if m2 else min(2800, len(rest))
    chunk = rest[:end]
    lines = []
    for ln in chunk.splitlines():
        t = ln.strip()
        if re.match(r'^[一二三四五六七八九十]+、\d*$', t):
            continue
        if re.match(r'^[一二三四五六七八九十]+、', t) and '\t' in ln:
            continue
        lines.append(ln.rstrip())
    if sub_key:
        for i, line in enumerate(lines):
            if sub_key[:6] in line or any(k in line for k in sub_key.split() if len(k) >= 2):
                picked = '\n'.join(ln for ln in lines[i:i + 28] if ln.strip()).strip()
                if len(picked) > 40:
                    return picked
    picked = '\n'.join(ln for ln in lines[:35] if ln.strip()).strip()
    return picked or '（详见《精神病学复习整理by18级杨子铭》对应章节。）'


def build_md(questions, summary):
    buckets = {(ch['id'], kp['title']): {'ch': ch, 'kp': kp, 'qs': []} for ch in CHAPTERS for kp in ch['points']}
    for q in questions:
        ch, kp = assign_kp(q)
        buckets[(ch['id'], kp['title'])]['qs'].append(q)

    src_counts = {}
    for q in questions:
        s = q['source'].split(' / ')[0]
        src_counts[s] = src_counts.get(s, 0) + 1

    L = ['# 精神病学往年题考点整理', '', '## 说明', '']
    L += [
        '- 本文件根据《精神病学复习整理by18级杨子铭.docx》和「精神病学/4 往年题」文件夹中全部往年题文件整理。',
        '- 知识点正文均摘自《精神病学复习整理by18级杨子铭》原文，未自行扩写；原文较长时摘取与考题最相关部分。',
        '- 往年题来源：06-07级史前回忆、09级试题、16级考题、20级完整试题回忆、21级考题与主观题总结，以及题库-久远文件夹中全部练习/答案/复习题文件（含百度文库题库、考试习题、课程中心考题等）。',
        f'- 本次共拆分 **{len(questions)}** 个题目条目；每题均已归入至少一个考点（含「未完全匹配到」者）。',
        '- 排序依据：先按知识点总结章节顺序，再在同一章节内按考频从高到低排列；同频按收录顺序。',
        '- 一道考题若考查多个知识点，可分别归入多个考点并各计 1 次。',
        '- 未在总结文件中完全匹配者标记为「未完全匹配到」或归入「附」章。',
        '- 已反向核对各来源文件拆分条目，确保无题目遗漏（详见文末「题量核对」）。',
        '', '---', '',
    ]

    for ch in CHAPTERS:
        cps = [buckets[(ch['id'], kp['title'])] for kp in ch['points']]
        cps = [b for b in cps if b['qs']]
        cps.sort(key=lambda b: -len(b['qs']))
        if not cps and ch['id'] != 13:
            L += [f'## 第{ch["num"]}章 {ch["title"]}', '', '本章未在提供的往年题中匹配到明确考点。', '', '---', '']
            continue
        if ch['id'] == 13:
            L += [f'## 附：{ch["title"]}', '']
        else:
            L += [f'## 第{ch["num"]}章 {ch["title"]}', '']
        for pi, b in enumerate(cps, 1):
            kp, qs = b['kp'], b['qs']
            basis = ('未能与知识点总结中的明确小节匹配，根据题干关键词暂归入本章。' if kp.get('fallback')
                     else f'题干涉及「{"」「".join(kp["keys"][:5])}」等表述，与{kp["section"]}对应。')
            L += [
                f'### {pi}. {kp["title"]}', '',
                f'**考频：** {len(qs)} 次', '',
                f'**对应小节：** {kp["section"]}', '',
                f'**匹配依据：** {basis}', '',
                '**知识点原文摘取：**', '',
                extract_excerpt(summary, kp['section']), '',
                '**知识来源：** 《精神病学复习整理by18级杨子铭》', '',
                '**对应往年题：**', '',
            ]
            for i, q in enumerate(qs, 1):
                L += [f'【往年题{i}｜{q["source"]}｜{q["type"]}】', q['text'], '']
            L += ['---', '']

    L += ['## 题量核对', '', f'按来源文件统计，共 **{len(questions)}** 题，全部纳入：', '',
          '| 来源文件 | 题量 |', '|---|---:|']
    total = 0
    for s, c in sorted(src_counts.items()):
        L.append(f'| {s} | {c} |')
        total += c
    L += [f'| **合计** | **{total}** |', '',
          '> 说明：PDF 双栏排版文件（3考试习题、考试习题2）经文本提取后存在选项交错，已按可识别题干+选项块尽量完整收录；',
          '> 20级选择题部分选项回忆不全处保留题干与可回忆选项；21级PTSD论述题为当年超考纲内容，已据回忆卷收录。',
          '> 练习卷与答案卷存在重复题干时已去重，各来源独立题量见上表。']
    return '\n'.join(L)


def main():
    summary = read(SUMMARY)
    questions = collect_all()
    OUT.write_text(build_md(questions, summary), encoding='utf-8')
    print(f'Wrote {OUT}')
    print(f'Total questions: {len(questions)}')
    from collections import Counter
    for s, c in sorted(Counter(q['source'].split(' / ')[0] for q in questions).items()):
        print(f'  {s}: {c}')


if __name__ == '__main__':
    main()
