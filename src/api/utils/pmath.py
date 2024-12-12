def compute_size(placements:dict, table_index:int):
    size = 0
    for v in placements.values():
        if(table_index == v['table']):
            size += v['party']
    return size


def compute_remaining(placements:dict, tables:list, table_index:int):
    return tables[table_index][2] - compute_size(placements, table_index) 

def has_mealspace(placements:dict, meals:dict, mealname:str):
    return get_mealspace(placements, meals, mealname) > 0


def get_mealspace(placements:dict, meals:dict, mealname:str):
    amnt = meals[mealname]
    for v in placements.values():
        for meal in v['meals']:
            if meal == mealname:
                amnt -= 1
    return amnt