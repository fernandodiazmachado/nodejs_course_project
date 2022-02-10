import { IsEmail, Length } from "class-validator";
import {
  Arg,
  Field,
  InputType,
  Mutation,
  Resolver,
  ObjectType,
} from "type-graphql";
import { getRepository, Repository } from "typeorm";
import { User } from "../entity/user.entity";
import { compareSync, hash } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { environment } from "../config/environments";

@InputType()
class UserInput {
  @Field()
  @Length(3, 64)
  fullname!: string;

  @Field()
  @IsEmail()
  email!: string;

  @Field()
  @Length(8, 254)
  password!: string;
}

@InputType()
class LoginInput {
  @Field()
  @IsEmail()
  email!: string;
  @Field()
  password!: string;
}

@ObjectType()
class LoginResponse {
  @Field()
  userId!: number;

  @Field()
  jwt!: string;
}

@Resolver()
export class UserResolver {
  userRepository: Repository<User>;

  constructor() {
    this.userRepository = getRepository(User);
  }

  @Mutation(() => User)
  async registerUser(
    @Arg("input", () => UserInput) input: UserInput
  ): Promise<User | undefined> {
    try {
      const { fullname, email, password } = input;

      const userExits = await this.userRepository.findOne({ where: { email } });

      // Verifico que el email esté disponible para poder registrarlo
      if (userExits) {
        const error = new Error();
        error.message = "Email is not available";
        throw error;
      }

      // hasheo la password
      const hashedPassword = await hash(password, 10);

      const newUser = await this.userRepository.insert({
        fullname,
        email,
        password: hashedPassword,
      });

      return this.userRepository.findOne(newUser.identifiers[0].id);
    } catch (error) {
      throw error;
    }
  }

  @Mutation(() => LoginResponse)
  async login(@Arg("input", () => LoginInput) input: LoginInput) {
    try {
      const { email, password } = input;
      const userFound = await this.userRepository.findOne({ where: { email } });
      if (!userFound) {
        const error = new Error();
        error.message = "Invalid credentials";
        throw error;
      }

      const isValidPassword: boolean = compareSync(
        password,
        userFound.password
      );

      if (!isValidPassword) {
        const error = new Error();
        error.message = "Invalid credentials";
        throw error;
      }

      const jwt: string = sign({ id: userFound.id }, environment.JWT_SECRET);

      return {
        userId: userFound.id,
        jwt,
      };
    } catch (error) {
      throw error;
    }
  }
}
