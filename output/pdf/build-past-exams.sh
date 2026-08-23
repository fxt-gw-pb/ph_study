#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/../.." && pwd)"
work_dir="$repo_root/tmp/pdfs/prevention-medicine-past-exams"
latex_dir="$work_dir/latex"
tex_file="$script_dir/prevention-medicine-past-exams.tex"
pdf_file="$script_dir/预防医学大四下往年题（截止22级）.pdf"

mkdir -p "$work_dir" "$latex_dir"

sources=(
  "知识仓库/职业卫生学往年题考点整理.md"
  "知识仓库/毒理学往年题考点整理.md"
  "知识仓库/流行病学往年题考点整理.md"
  "知识仓库/环境健康学往年题考点整理.md"
  "知识仓库/营养学往年题考点整理.md"
  "知识仓库/精神病学往年题考点整理.md"
  "知识仓库/职业病学往年题总结.md"
)

processed=()
index=1
for source in "${sources[@]}"; do
  target="$work_dir/$(printf '%02d' "$index")-$(basename "$source")"
  # Source separators are sometimes immediately followed by a heading.
  # Blank lines force Pandoc to parse them as thematic breaks, not tables.
  perl -0pe 's/\r\n?/\n/g; s/\n[ \t]*---[ \t]*\n/\n\n---\n\n/g' \
    "$repo_root/$source" > "$target"
  processed+=("$target")
  index=$((index + 1))
done

pandoc \
  -f markdown-yaml_metadata_block-subscript-superscript+hard_line_breaks \
  -t latex \
  --standalone \
  --file-scope \
  --top-level-division=part \
  --syntax-highlighting=none \
  --lua-filter="$script_dir/past-exams-filter.lua" \
  --template="$script_dir/past-exams-template.tex" \
  --wrap=auto \
  --columns=110 \
  "${processed[@]}" \
  -o "$tex_file"

latexmk \
  -xelatex \
  -interaction=nonstopmode \
  -halt-on-error \
  -file-line-error \
  -outdir="$latex_dir" \
  "$tex_file"

cp "$latex_dir/prevention-medicine-past-exams.pdf" "$pdf_file"

printf 'TeX: %s\n' "$tex_file"
printf 'PDF: %s\n' "$pdf_file"
