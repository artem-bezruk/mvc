"use strict";
export function fnTryParseUseImportVer8(text: string) {
    let input_lines = text.split("\n");
    let filtered_lines: string[] = [];
    for (let index = 0; index < input_lines.length; index++) {
        const line = input_lines[index];
        if (line.match(new RegExp(/^use[ ]{1}(.*)[;]{1}/)) != null) {
            filtered_lines.push(line);
        }
    }
    let results = [];
    for (let index = 0; index < filtered_lines.length; index++) {
        const line = filtered_lines[index];
        let [data, error] = fnTryParseLine(line);
        if (data != null) {
            results.push(data);
        }
    }
    return [
        results,
        null,
    ];
}
function fnTryParseLine(text: string) {
    let use_beg_pos: number = text.indexOf('use ', 0);
    if (-1 == use_beg_pos) {
        return [
            null,
            new Error('use_not_found'),
        ];
    }
    let sub_text: string = text.substring(use_beg_pos);
    if (0 == sub_text.length) {
        return [
            null,
            new Error('substring_is_empty'),
        ];
    }
    let use_end_pos: number = text.indexOf(';', use_beg_pos);
    if (-1 == use_end_pos) {
        return [
            null,
            new Error('close_use_not_found'),
        ];
    }
    sub_text = text.substring(use_beg_pos, use_end_pos + 1);
    if (0 == sub_text.length) {
        return [
            null,
            new Error('substring_is_empty_2'),
        ];
    }
    sub_text = sub_text.replace('use ', '');
    sub_text = sub_text.replace(';', '');
    if (0 == sub_text.length) {
        return [
            null,
            new Error('substring_not_found_2'),
        ];
    }
    let class_text = sub_text;
    let class_dot = class_text.replace(new RegExp(/[\\]{1}/gi), '.');
    if (0 == class_dot.length) {
        return [
            null,
            new Error('class_is_empty'),
        ];
    }
    let klass_parts = class_dot.split('.');
    if (0 == klass_parts.length) {
        return [
            null,
            new Error('namespace_is_empty'),
        ];
    }
    let last_part = klass_parts[klass_parts.length - 1];
    let klass_name_ori: string = last_part;
    let klass_alias: string | null = null;
    let has_alias = false;
    if (-1 != last_part.toLowerCase().indexOf(' as ')) {
        has_alias = true;
        try {
            let words = last_part.split(' as ');
            klass_name_ori = words[0];
            klass_alias = words[1];
        } catch (error) {
            console.error({ error });
        }
    }
    let filtered_klass_parts = [];
    for (let index = 0; index < klass_parts.length; index++) {
        const part = klass_parts[index];
        if (index == (klass_parts.length - 1)) {
            if (has_alias) {
                filtered_klass_parts.push(klass_name_ori);
            } else {
                filtered_klass_parts.push(part);
            }
        } else {
            filtered_klass_parts.push(part);
        }
    }
    let filtered_class = filtered_klass_parts.join("\\");
    let filtered_class_dot = filtered_klass_parts.join(".");
    let useable_class_name: string | null = null;
    if (has_alias) {
        useable_class_name = klass_alias
    } else {
        useable_class_name = klass_name_ori;
    }
    let data = {
        raw: text,
        has_alias: has_alias,
        klass_alias: klass_alias,
        useable_class_name: useable_class_name,
        class: filtered_class,
        class_dot: filtered_class_dot,
        class_parts: filtered_klass_parts,
    };
    return [
        data,
        null,
    ];
}
