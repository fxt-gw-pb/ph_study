-- Pandoc filter for the preventive-medicine past-exam compendium.
-- It preserves every source paragraph while adapting the hierarchy and
-- recurring metadata labels to the book design in past-exams-template.tex.

local question_mode = false

local subjects = {
  ["职业卫生学往年题考点整理"] = { title = "职业卫生学", color = "2D5FD5" },
  ["毒理学往年题考点整理"] = { title = "毒理学", color = "0F8A78" },
  ["流行病学往年题考点整理"] = { title = "流行病学", color = "B16A2B" },
  ["环境健康学往年题考点整理"] = { title = "环境健康学", color = "3D8A4F" },
  ["营养学往年题考点整理"] = { title = "营养与食品卫生学", color = "C25A26" },
  ["精神病学往年题考点整理"] = { title = "精神病学", color = "7A4EC9" },
  ["职业病学往年题总结"] = { title = "职业病学", color = "B6432F" },
}

local unnumbered_chapters = {
  ["说明"] = true,
  ["章节备注"] = true,
  ["题量核对"] = true,
  ["题源反向核对索引"] = true,
}

local label_commands = {
  ["对应小节："] = "\\InfoLabel{对应小节}",
  ["对应小节:"] = "\\InfoLabel{对应小节}",
  ["匹配依据："] = "\\InfoLabel{匹配依据}",
  ["匹配依据:"] = "\\InfoLabel{匹配依据}",
  ["知识来源："] = "\\InfoLabel{知识来源}",
  ["知识来源:"] = "\\InfoLabel{知识来源}",
  ["版本提示："] = "\\WarningLabel{版本提示}",
  ["版本提示:"] = "\\WarningLabel{版本提示}",
}

local function stringify(value)
  return pandoc.utils.stringify(value)
end

local function trim(text)
  return text:gsub("^%s+", ""):gsub("%s+$", "")
end

local function latex_escape(text)
  text = text:gsub("\\", "\\textbackslash{}")
  text = text:gsub("([%%#&{}_])", "\\%1")
  text = text:gsub("%$", "\\$")
  text = text:gsub("%~", "\\textasciitilde{}")
  text = text:gsub("%^", "\\textasciicircum{}")
  return text
end

local function drop_leading_number(inlines)
  if #inlines >= 1 and inlines[1].t == "Str" then
    local first = inlines[1].text
    if first:match("^%d+%.$") or first:match("^%d+、$") then
      table.remove(inlines, 1)
      if #inlines >= 1 and inlines[1].t == "Space" then
        table.remove(inlines, 1)
      end
    end
  end
end

local function strip_chapter_prefix(header)
  local title = stringify(header.content)

  -- Toxicology uses headings such as “第一章 / 《1 绪论》”.
  local special = title:match("^第.-章%s*/%s*《%d+%s*(.-)》$")
  if special then
    special = special:gsub("》《%d+%s*", " / ")
    header.content = pandoc.Inlines({ pandoc.Str(special) })
    return special
  end

  if #header.content >= 1 and header.content[1].t == "Str"
      and header.content[1].text:match("^第.-章$") then
    table.remove(header.content, 1)
    if #header.content >= 1 and header.content[1].t == "Space" then
      table.remove(header.content, 1)
    end
  end
  return stringify(header.content)
end

function Header(header)
  question_mode = false

  if header.level == 1 then
    local source_title = stringify(header.content)
    local subject = subjects[source_title]
    if subject then
      header.content = pandoc.Inlines({ pandoc.Str(subject.title) })
      header.identifier = ""
      return {
        pandoc.RawBlock(
          "latex",
          "\\SetSubjectAccent{" .. subject.color .. "}{" .. latex_escape(subject.title) .. "}"
        ),
        header,
      }
    end
  elseif header.level == 2 then
    local title = strip_chapter_prefix(header)
    if unnumbered_chapters[title] or title:match("^附[：:]") then
      header.classes:insert("unnumbered")
    end
  elseif header.level == 3 then
    drop_leading_number(header.content)
  end

  return header
end

function HorizontalRule()
  question_mode = false
  return pandoc.RawBlock("latex", "\\PointSeparator")
end

local function transform_strong_labels(inlines)
  for index, inline in ipairs(inlines) do
    if inline.t == "Strong" then
      local text = trim(stringify(inline.content))
      local frequency = text:match("^考频：%s*(.*)$") or text:match("^考频:%s*(.*)$")
      if frequency then
        if frequency == "" then
          inlines[index] = pandoc.RawInline("latex", "\\InfoLabel{考频}")
        else
          inlines[index] = pandoc.RawInline(
            "latex",
            "\\FrequencyPill{" .. latex_escape(frequency) .. "}"
          )
        end
      elseif label_commands[text] then
        inlines[index] = pandoc.RawInline("latex", label_commands[text])
      end
    end
  end
  return inlines
end

function Math(math)
  -- In the source formulas, TeX commands are occasionally followed directly
  -- by Chinese text (for example, \times患病率).  Insert an empty group so
  -- XeTeX does not absorb the Chinese characters into the control-sequence
  -- name.  CJK glyphs in math mode are handled by CJKmath in the template.
  math.text = math.text:gsub("(\\%a+)([\224-\239][\128-\191][\128-\191])", "%1{}%2")
  return math
end

function Table(table_block)
  -- Two-column source indexes often contain long filenames.  Explicit
  -- relative widths let longtable wrap them instead of crossing the margin.
  if #table_block.colspecs == 2 then
    table_block.colspecs[1][2] = 0.70
    table_block.colspecs[2][2] = 0.12
  end
  return table_block
end

local function emphasize_question_label(inlines)
  for index, inline in ipairs(inlines) do
    if inline.t == "LineBreak" then
      table.insert(inlines, index, pandoc.RawInline("latex", "}"))
      table.insert(inlines, 1, pandoc.RawInline("latex", "\\QuestionLabel{"))
      return inlines
    end
  end
  return inlines
end

function Para(paragraph)
  local text = trim(stringify(paragraph.content))

  if text == "知识点原文摘取：" or text == "知识点原文摘取:" then
    question_mode = false
    return pandoc.RawBlock("latex", "\\ContentBand{知识点原文摘取}")
  end

  if text == "对应往年题：" or text == "对应往年题:" then
    question_mode = true
    return pandoc.RawBlock("latex", "\\ContentBand{对应往年题}")
  end

  if text:match("^【勘误") then
    question_mode = false
    return {
      pandoc.RawBlock("latex", "\\begin{correctionbox}"),
      paragraph,
      pandoc.RawBlock("latex", "\\end{correctionbox}"),
    }
  end

  if question_mode then
    paragraph.content = emphasize_question_label(paragraph.content)
    return {
      pandoc.RawBlock("latex", "\\begin{pastquestion}"),
      paragraph,
      pandoc.RawBlock("latex", "\\end{pastquestion}"),
    }
  end

  paragraph.content = transform_strong_labels(paragraph.content)
  return paragraph
end
