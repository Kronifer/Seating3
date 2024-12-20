def compute_size(registered:dict, table_index:int):
    size = 0
    for v in registered.values():
        if(table_index == v['table']):
            size += v['party']
    return size


def compute_remaining(registered:dict, tables:list, table_index:int):
    return tables[table_index][2] - compute_size(registered, table_index) 

def has_mealspace(registered:dict, meals:dict, mealname:str):
    return get_mealspace(registered, meals, mealname) > 0


def get_mealspace(registered:dict, meals:dict, mealname:str):
    amnt = meals[mealname]
    for v in registered.values():
        for meal in v['meals']:
            if meal == mealname:
                amnt -= 1
    return amnt