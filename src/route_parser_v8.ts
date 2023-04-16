"use strict";
export function fnTryParseRouteVer8(text: string) {
    let r_route = '(Route[:]{2})';
    let r_method = '([a-zA-Z]{1,})';
    let r_bracket_open = '([\(]{1})';
    let r_bracket_close = '([\)]{1})';
    let r_route_path = '([\']{1}(.*)[\']{1})';
    let r_all_basic = '' +
        r_route +
        r_method +
        r_bracket_open +
        '(.*)?' + 
        r_route_path +
        '(.*)?' + 
        '(.*)?' + 
        '(.*)?' + 
        '(.*)?' + 
        '(.*)?' + 
        '(.*)?' + 
        '(.*)?' + 
        r_bracket_close;
    let regex_basic = new RegExp(r_all_basic);
    let kotak_beg_pos: number = text.indexOf('[', 0);
    if (-1 == kotak_beg_pos) {
        return [
            null,
            new Error('char_not_found_1'),
        ];
    }
    let sub_text: string = text.substring(kotak_beg_pos);
    if (0 == sub_text.length) {
        return [
            null,
            new Error('substring_not_found_1'),
        ];
    }
    let kotak_end_pos: number = text.indexOf(']', kotak_beg_pos);
    if (-1 == kotak_end_pos) {
        return [
            null,
            new Error('char_not_found_2'),
        ];
    }
    sub_text = text.substring(kotak_beg_pos, kotak_end_pos + 1);
    if (0 == sub_text.length) {
        return [
            null,
            new Error('substring_not_found_1'),
        ];
    }
    sub_text = sub_text.replace('[', '');
    sub_text = sub_text.replace(']', '');
    if (0 == sub_text.length) {
        return [
            null,
            new Error('substring_not_found_2'),
        ];
    }
    let words: string[] = sub_text.split(',');
    if (typeof words[0] !== 'string') {
        return [
            null,
            new Error('words0_is_not_string'),
        ];
    }
    if (typeof words[1] !== 'string') {
        return [
            null,
            new Error('words1_is_not_string'),
        ];
    }
    let class_text: string = words[0];
    let action_text: string = words[1];
    class_text = class_text.trim();
    action_text = action_text.trim();
    let action_regex = new RegExp('^[\']([_a-zA-Z0-9]{1,})[\']$');
    let action_matches = action_text.match(action_regex);
    if (null == action_matches) {
        return [
            null,
            new Error('action_not_match'),
        ];
    }
    action_text = action_text.replace("'", '');
    action_text = action_text.replace("'", '');
    if (0 == action_text.length) {
        return [
            null,
            new Error('action_is_empty'),
        ];
    }
    let is_absolute_path = false;
    if (0 == class_text.indexOf('\\')) {
        is_absolute_path = true;
    }
    let class_pos = class_text.indexOf('::class');
    if (-1 == class_pos) {
        return [
            null,
            new Error('class_not_found'),
        ];
    }
    class_text = class_text.replace('::class', '');
    if (0 == class_text.length) {
        return [
            null,
            new Error('class_is_empty'),
        ];
    }
    if (is_absolute_path) {
        class_text = class_text.replace('\\', '');
    }
    if (0 == class_text.indexOf('App\\')) {
        is_absolute_path = true;
    }
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
    let data = {
        is_class_path_absolute: is_absolute_path,
        class: class_text,
        class_dot: class_dot,
        class_parts: klass_parts,
        use_class_name: klass_parts[klass_parts.length - 1],
        action: action_text,
    };
    return [
        data,
        null,
    ];
}
