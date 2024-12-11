def compute_size(placements:dict, table_index:int):
    size = 0
    for v in placements.values():
        if(table_index == v['table']):
            size += v['party']
    return size


def compute_remaining(placements:dict, tables:list, table_index:int):
    return tables[table_index][2] - compute_size(placements, table_index) 