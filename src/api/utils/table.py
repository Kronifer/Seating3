def compute_size(placements:dict, table_index:int):
    size = 0
    for party_size, current_index in placements.values():
        if(table_index == current_index):
            size += party_size


def compute_remaining(placements:dict, tableMap:list, table_index:int):
    return compute_size(placements, table_index) - tableMap[table_index][2] 