from multiprocessing.spawn import old_main_modules
from string import ascii_lowercase
def temp():
    with open("DICTIONARY","r") as infile:
        dictionary = infile.read().splitlines()

        candidates = []

        for word in dictionary:
            #olin
            c = False

            for i in 'olin':
                if i in word:
                    c = True
                    break


            if c == False:
                continue

            for i in "stare":
                if i in word:
                    c = False
                    break
            
            

            if c:
                candidates.append(word)

        candidates_score = []
        for word in candidates:
            score = 0
            for i in 'olin':
                if i in word:
                    score += 1

            candidates_score.append((word, score))

        candidates_score.sort(key=lambda x: x[1], reverse=True)
        print(candidates_score)
            

def check():
    with open("DICTIONARY","r") as infile:
        dictionary = infile.read().splitlines()

        

        for word in dictionary:
            c = True
            if word[1] != 'o':
                c = False
                continue
            if 'i' not in word:
                c = False
                continue
            for i in 'arecln':
                if i in word:
                    c = False
                    break
            if c:
                print(word)


def checkExistingalphabet(word):
    count = 0
    letters = []
    for i in ascii_lowercase:
        if i in word:
            count += 1
            letters.append(i)

    return count, letters

def makeDictionary():
    dictionary = []
    counter = 0
    filenames = ["index.adj", "index.adv", "index.noun", "index.verb"]
    for i in filenames:
        with open("TEMP", 'w') as outfile:
            with open("./database/dict/"+i,'r') as infile:
                for line in infile:
                    firstword = line.split(" ")[0]
                    if len(firstword) == 5 and firstword.isalpha():
                        counter += 1
                        dictionary.append(firstword+"\n")
                    elif len(firstword) == 4 and firstword.isalpha():
                        counter+=1
                        dictionary.append(firstword+"s\n")

    with open("TEMP", 'w') as outfile:
            with open("./database/dict/index.sense",'r') as infile:
                for line in infile:
                    firstword = line.split("%")[0]
                    if len(firstword) == 5 and firstword.isalpha():
                        counter += 1
                        dictionary.append(firstword+"\n")
                    elif len(firstword) == 4 and firstword.isalpha():
                        counter+=1
                        dictionary.append(firstword+"s\n")

    print(len(dictionary))
    dictionary = set(dictionary)
    print(len(dictionary))
    with open("TEMP", 'w') as outfile:
        for i in dictionary:
            outfile.write(i)

makeDictionary()